/**
 * Bulk operations utilities for admin panel
 */
import { useState } from 'react';
import { Trash2, Shield, UserPlus, UserMinus, Download, X } from 'lucide-react';

/**
 * Bulk operation types
 */
export const BULK_ACTIONS = {
    DELETE: 'delete',
    UPDATE: 'update',
    EXPORT: 'export',
    BAN: 'ban',
    UNBAN: 'unban',
    PROMOTE: 'promote',
    DEMOTE: 'demote'
};

/**
 * Execute bulk operation on multiple items
 * @param {Array} items - Array of item IDs
 * @param {string} action - Action to perform
 * @param {Object} options - Action-specific options
 * @param {Function} apiCall - API function to call for each item
 * @returns {Promise<Object>} Operation result
 */
export async function executeBulkOperation(items, action, options = {}, apiCall) {
    if (!items || items.length === 0) {
        throw new Error('No items selected for bulk operation');
    }

    const results = {
        success: [],
        failed: [],
        total: items.length
    };

    // Process items with concurrency control
    const CONCURRENT_LIMIT = 5;
    const batches = [];

    for (let i = 0; i < items.length; i += CONCURRENT_LIMIT) {
        batches.push(items.slice(i, i + CONCURRENT_LIMIT));
    }

    for (const batch of batches) {
        const promises = batch.map(async (item) => {
            try {
                const result = await apiCall(item, action, options);
                results.success.push({ id: item, result });
                return { id: item, success: true, result };
            } catch (error) {
                results.failed.push({ id: item, error: error.message });
                return { id: item, success: false, error: error.message };
            }
        });

        await Promise.all(promises);
    }

    return {
        ...results,
        succeeded: results.success.length,
        failed: results.failed.length,
        successRate: (results.success.length / results.total * 100).toFixed(1)
    };
}

/**
 * Bulk selection manager hook
 * @param {Array} items - Available items
 * @returns {Object} Selection management functions
 */
export function useBulkSelection(items = []) {
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);

    const toggleItem = (itemId) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedItems(new Set());
            setSelectAll(false);
        } else {
            setSelectedItems(new Set(items.map(item => item.id)));
            setSelectAll(true);
        }
    };

    const clearSelection = () => {
        setSelectedItems(new Set());
        setSelectAll(false);
    };

    const isSelected = (itemId) => selectedItems.has(itemId);
    const selectedCount = selectedItems.size;

    return {
        selectedItems: Array.from(selectedItems),
        isSelected,
        toggleItem,
        toggleSelectAll,
        clearSelection,
        selectedCount,
        selectAll,
        hasSelection: selectedCount > 0
    };
}

/**
 * Bulk action confirmation modal
 * @param {Object} props - Component props
 * @returns {JSX.Element} Confirmation modal
 */
export function BulkActionConfirmation({
    action,
    itemCount,
    onConfirm,
    onCancel,
    isOpen
}) {
    if (!isOpen) return null;

    const actionInfo = getActionInfo(action);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${actionInfo.color}`}>
                        {actionInfo.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                        Confirm Bulk {actionInfo.label}
                    </h3>
                </div>

                <p className="text-gray-300 mb-6">
                    Are you sure you want to {actionInfo.verb.toLowerCase()} {itemCount} item{itemCount !== 1 ? 's' : ''}?
                    This action cannot be undone.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2 px-4 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium ${actionInfo.buttonClass} transition-colors`}
                    >
                        {actionInfo.label} {itemCount} Items
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Get action information for display
 * @param {string} action - Action type
 * @returns {Object} Action information
 */
function getActionInfo(action) {
    const actions = {
        [BULK_ACTIONS.DELETE]: {
            label: 'Delete',
            verb: 'Delete',
            icon: <Trash2 className="text-red-500" size={20} />,
            color: 'bg-red-500/10',
            buttonClass: 'bg-red-600 hover:bg-red-700 text-white'
        },
        [BULK_ACTIONS.BAN]: {
            label: 'Ban',
            verb: 'Ban',
            icon: <Shield className="text-red-500" size={20} />,
            color: 'bg-red-500/10',
            buttonClass: 'bg-red-600 hover:bg-red-700 text-white'
        },
        [BULK_ACTIONS.UNBAN]: {
            label: 'Unban',
            verb: 'Unban',
            icon: <Shield className="text-green-500" size={20} />,
            color: 'bg-green-500/10',
            buttonClass: 'bg-green-600 hover:bg-green-700 text-white'
        },
        [BULK_ACTIONS.PROMOTE]: {
            label: 'Promote',
            verb: 'Promote',
            icon: <UserPlus className="text-blue-500" size={20} />,
            color: 'bg-blue-500/10',
            buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white'
        },
        [BULK_ACTIONS.DEMOTE]: {
            label: 'Demote',
            verb: 'Demote',
            icon: <UserMinus className="text-yellow-500" size={20} />,
            color: 'bg-yellow-500/10',
            buttonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        },
        [BULK_ACTIONS.EXPORT]: {
            label: 'Export',
            verb: 'Export',
            icon: <Download className="text-indigo-500" size={20} />,
            color: 'bg-indigo-500/10',
            buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }
    };

    return actions[action] || actions[BULK_ACTIONS.UPDATE];
}

/**
 * Bulk operation progress tracker
 * @param {Object} props - Component props
 * @returns {JSX.Element} Progress indicator
 */
export function BulkOperationProgress({
    operation,
    progress,
    onCancel
}) {
    if (!operation) return null;

    const percentage = Math.round((progress.completed / progress.total) * 100);

    return (
        <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-800 rounded-lg p-4 w-80 shadow-xl">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">
                    {operation.action} ({progress.completed}/{progress.total})
                </span>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-white"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="text-xs text-gray-400">
                {percentage}% complete
            </div>
        </div>
    );
}

// Export icons for convenience
export { Trash2, Shield, UserPlus, UserMinus, Download, X } from 'lucide-react';