/**
 * Advanced search and filtering utilities
 */

/**
 * Search configuration types
 */
export const SEARCH_TYPES = {
    TEXT: 'text',
    DATE_RANGE: 'date_range',
    NUMBER_RANGE: 'number_range',
    SELECT: 'select',
    MULTI_SELECT: 'multi_select',
    BOOLEAN: 'boolean'
};

/**
 * Advanced search filter builder
 */
export class AdvancedFilterBuilder {
    constructor() {
        this.filters = [];
    }

    /**
     * Add text search filter
     */
    addTextSearch(fields, value, options = {}) {
        if (!value) return this;
        
        const {
            operator = 'contains',
            caseSensitive = false,
            wholeWord = false
        } = options;

        this.filters.push({
            type: SEARCH_TYPES.TEXT,
            fields,
            value,
            operator,
            caseSensitive,
            wholeWord
        });

        return this;
    }

    /**
     * Add date range filter
     */
    addDateRange(field, startDate, endDate) {
        if (!startDate && !endDate) return this;

        this.filters.push({
            type: SEARCH_TYPES.DATE_RANGE,
            field,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null
        });

        return this;
    }

    /**
     * Add number range filter
     */
    addNumberRange(field, min, max) {
        if (min === undefined && max === undefined) return this;

        this.filters.push({
            type: SEARCH_TYPES.NUMBER_RANGE,
            field,
            min: min !== undefined ? Number(min) : null,
            max: max !== undefined ? Number(max) : null
        });

        return this;
    }

    /**
     * Add select filter
     */
    addSelect(field, value) {
        if (!value) return this;

        this.filters.push({
            type: SEARCH_TYPES.SELECT,
            field,
            value
        });

        return this;
    }

    /**
     * Add multi-select filter
     */
    addMultiSelect(field, values) {
        if (!values || values.length === 0) return this;

        this.filters.push({
            type: SEARCH_TYPES.MULTI_SELECT,
            field,
            values: Array.isArray(values) ? values : [values]
        });

        return this;
    }

    /**
     * Add boolean filter
     */
    addBoolean(field, value) {
        if (value === undefined || value === null) return this;

        this.filters.push({
            type: SEARCH_TYPES.BOOLEAN,
            field,
            value: Boolean(value)
        });

        return this;
    }

    /**
     * Build Prisma where clause
     */
    buildPrismaWhere() {
        const where = {};

        this.filters.forEach(filter => {
            switch (filter.type) {
                case SEARCH_TYPES.TEXT:
                    this.buildTextFilter(where, filter);
                    break;
                case SEARCH_TYPES.DATE_RANGE:
                    this.buildDateRangeFilter(where, filter);
                    break;
                case SEARCH_TYPES.NUMBER_RANGE:
                    this.buildNumberRangeFilter(where, filter);
                    break;
                case SEARCH_TYPES.SELECT:
                    where[filter.field] = filter.value;
                    break;
                case SEARCH_TYPES.MULTI_SELECT:
                    where[filter.field] = { in: filter.values };
                    break;
                case SEARCH_TYPES.BOOLEAN:
                    where[filter.field] = filter.value;
                    break;
            }
        });

        return where;
    }

    /**
     * Build text search filter for Prisma
     */
    buildTextFilter(where, filter) {
        const conditions = filter.fields.map(field => {
            const condition = {};
            
            switch (filter.operator) {
                case 'contains':
                    condition[field] = {
                        contains: filter.value,
                        mode: filter.caseSensitive ? 'default' : 'insensitive'
                    };
                    break;
                case 'startsWith':
                    condition[field] = {
                        startsWith: filter.value,
                        mode: filter.caseSensitive ? 'default' : 'insensitive'
                    };
                    break;
                case 'endsWith':
                    condition[field] = {
                        endsWith: filter.value,
                        mode: filter.caseSensitive ? 'default' : 'insensitive'
                    };
                    break;
                case 'equals':
                    condition[field] = filter.caseSensitive 
                        ? filter.value 
                        : { equals: filter.value, mode: 'insensitive' };
                    break;
            }

            return condition;
        });

        // Combine with OR logic
        if (conditions.length > 1) {
            where.OR = conditions;
        } else {
            Object.assign(where, conditions[0]);
        }
    }

    /**
     * Build date range filter for Prisma
     */
    buildDateRangeFilter(where, filter) {
        const dateConditions = {};
        
        if (filter.startDate) {
            dateConditions.gte = filter.startDate;
        }
        
        if (filter.endDate) {
            dateConditions.lte = filter.endDate;
        }
        
        where[filter.field] = dateConditions;
    }

    /**
     * Build number range filter for Prisma
     */
    buildNumberRangeFilter(where, filter) {
        const numberConditions = {};
        
        if (filter.min !== null) {
            numberConditions.gte = filter.min;
        }
        
        if (filter.max !== null) {
            numberConditions.lte = filter.max;
        }
        
        where[filter.field] = numberConditions;
    }

    /**
     * Get filter summary for display
     */
    getSummary() {
        return this.filters.map(filter => {
            switch (filter.type) {
                case SEARCH_TYPES.TEXT:
                    return `${filter.fields.join(', ')} ${filter.operator} "${filter.value}"`;
                case SEARCH_TYPES.DATE_RANGE:
                    return `${filter.field}: ${filter.startDate?.toLocaleDateString() || 'any'} to ${filter.endDate?.toLocaleDateString() || 'any'}`;
                case SEARCH_TYPES.NUMBER_RANGE:
                    return `${filter.field}: ${filter.min ?? 'any'} to ${filter.max ?? 'any'}`;
                case SEARCH_TYPES.SELECT:
                    return `${filter.field} = ${filter.value}`;
                case SEARCH_TYPES.MULTI_SELECT:
                    return `${filter.field} in [${filter.values.join(', ')}]`;
                case SEARCH_TYPES.BOOLEAN:
                    return `${filter.field} = ${filter.value ? 'true' : 'false'}`;
                default:
                    return 'Unknown filter';
            }
        });
    }

    /**
     * Clear all filters
     */
    clear() {
        this.filters = [];
        return this;
    }

    /**
     * Remove specific filter
     */
    removeFilter(index) {
        this.filters.splice(index, 1);
        return this;
    }
}

/**
 * Quick search presets for common scenarios
 */
export const SEARCH_PRESETS = {
    ACTIVE_USERS: (builder) => 
        builder.addBoolean('isBanned', false).addBoolean('isVerified', true),
    
    RECENT_USERS: (builder) => 
        builder.addDateRange('createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
    
    ADMIN_USERS: (builder) => 
        builder.addSelect('role', 'ADMIN'),
    
    BANNED_USERS: (builder) => 
        builder.addBoolean('isBanned', true),
    
    HIGH_VALUE_PAYMENTS: (builder) => 
        builder.addNumberRange('amount', 1000, null),
    
    RECENT_PAYMENTS: (builder) => 
        builder.addDateRange('createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date())
};

/**
 * Search history manager
 */
export class SearchHistory {
    constructor(maxHistory = 10) {
        this.maxHistory = maxHistory;
        this.storageKey = 'admin-search-history';
        this.history = this.loadHistory();
    }

    /**
     * Add search to history
     */
    addSearch(query, filters, resultsCount) {
        const searchEntry = {
            id: Date.now(),
            query,
            filters,
            resultsCount,
            timestamp: new Date().toISOString()
        };

        // Remove duplicates
        this.history = this.history.filter(entry => 
            entry.query !== query || JSON.stringify(entry.filters) !== JSON.stringify(filters)
        );

        // Add new entry at beginning
        this.history.unshift(searchEntry);

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(0, this.maxHistory);
        }

        this.saveHistory();
    }

    /**
     * Get search history
     */
    getHistory() {
        return this.history;
    }

    /**
     * Clear search history
     */
    clearHistory() {
        this.history = [];
        this.saveHistory();
    }

    /**
     * Load history from localStorage
     */
    loadHistory() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Failed to load search history:', error);
            return [];
        }
    }

    /**
     * Save history to localStorage
     */
    saveHistory() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.history));
        } catch (error) {
            console.warn('Failed to save search history:', error);
        }
    }
}

/**
 * Search suggestions generator
 */
export class SearchSuggestions {
    constructor() {
        this.suggestions = new Map();
    }

    /**
     * Add suggestion source
     */
    addSource(name, getSuggestions) {
        this.suggestions.set(name, getSuggestions);
    }

    /**
     * Get suggestions for query
     */
    async getSuggestions(query, context = {}) {
        const allSuggestions = [];

        for (const [name, getSuggestions] of this.suggestions) {
            try {
                const suggestions = await getSuggestions(query, context);
                allSuggestions.push(...suggestions.map(s => ({
                    ...s,
                    source: name
                })));
            } catch (error) {
                console.warn(`Failed to get suggestions from ${name}:`, error);
            }
        }

        // Sort by relevance and remove duplicates
        return allSuggestions
            .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
            .filter((suggestion, index, self) => 
                index === self.findIndex(s => s.text === suggestion.text)
            )
            .slice(0, 10); // Limit to 10 suggestions
    }
}

// Export utility functions
export { useState, useEffect } from 'react';