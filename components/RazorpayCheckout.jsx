'use client'

import { useState } from 'react'
import { Loader2, CreditCard, Shield, Lock } from 'lucide-react'
import Image from 'next/image'

/**
 * Razorpay Checkout Component
 * Handles payment flow for course purchases
 */
export default function RazorpayCheckout({
  product,
  user,
  onSuccess,
  onError,
  onClose
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handlePayment = async () => {
    if (!user) {
      setError('Please login to continue')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Create order
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId: product.id
        })
      })

      const orderData = await orderRes.json()

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order')
      }

      // Check if in demo mode
      if (orderData.demoMode) {
        setError('Payment gateway not configured. Please contact admin.')
        setLoading(false)
        return
      }

      // Step 2: Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        await loadRazorpayScript()
      }

      // Step 3: Initialize Razorpay
      const options = {
        key: orderData.keyId,
        amount: orderData.razorpayOrder.amount,
        currency: orderData.razorpayOrder.currency,
        name: 'TRADEXFLOOR ACADEMY',
        description: product.title,
        order_id: orderData.razorpayOrder.id,
        prefill: {
          name: orderData.prefill?.name || user.name,
          email: orderData.prefill?.email || user.email,
        },
        theme: {
          color: '#FF00CC',
          backdrop_color: 'rgba(0, 0, 0, 0.8)'
        },
        modal: {
          backdropclose: false,
          escape: true,
          animation: true
        },
        handler: async function (response) {
          // Step 4: Verify payment
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderData.order.id
              })
            })

            const verifyData = await verifyRes.json()

            if (verifyData.success) {
              onSuccess && onSuccess({
                ...verifyData,
                product,
                paymentId: response.razorpay_payment_id
              })
            } else {
              throw new Error(verifyData.error || 'Payment verification failed')
            }
          } catch (err) {
            onError && onError(err.message)
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
            onClose && onClose()
          }
        }
      }

      const razorpay = new window.Razorpay(options)

      razorpay.on('payment.failed', function (response) {
        setLoading(false)
        onError && onError(response.error.description || 'Payment failed')
      })

      razorpay.open()
      setLoading(false)

    } catch (err) {
      setLoading(false)
      setError(err.message)
      onError && onError(err.message)
    }
  }

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = resolve
      script.onerror = () => reject(new Error('Failed to load Razorpay'))
      document.body.appendChild(script)
    })
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

        <div className="flex items-start gap-4 pb-4 border-b border-white/10">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.title}
              className="w-20 h-20 rounded-xl object-cover"
              width={80}
              height={80}
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-[#FF00CC]/20 to-[#00CCFF]/20 flex items-center justify-center">
              <CreditCard size={24} className="text-[#FF00CC]" />
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-medium">{product.title}</h4>
            <p className="text-sm text-gray-400 mt-1">{product.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-1 rounded-full bg-[#FF00CC]/20 text-[#FF00CC]">
                {product.type}
              </span>
              {product.type === 'VIDEO' && (
                <span className="text-xs text-gray-500">3 months access</span>
              )}
            </div>
          </div>
        </div>

        <div className="py-4 space-y-2">
          <div className="flex justify-between text-gray-400">
            <span>Subtotal</span>
            <span>₹{product.price}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>GST (18%)</span>
            <span>Included</span>
          </div>
          <div className="flex justify-between text-lg font-semibold pt-2 border-t border-white/10">
            <span>Total</span>
            <span className="gradient-text">₹{product.price}</span>
          </div>
        </div>
      </div>

      {/* Security Badges */}
      <div className="flex items-center justify-center gap-6 text-gray-500 text-sm">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-green-400" />
          <span>Secure Payment</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-green-400" />
          <span>SSL Encrypted</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full gradient-btn py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Processing...
          </>
        ) : (
          <>
            <CreditCard size={20} />
            Pay ₹{product.price}
          </>
        )}
      </button>

      {/* Payment Methods */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-3">Powered by Razorpay</p>
        <div className="flex items-center justify-center gap-3 opacity-60">
          <Image src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" height={24} width={80} className="h-6 w-auto" />
          <span className="text-xs text-gray-500">UPI • Cards • NetBanking • Wallets</span>
        </div>
      </div>
    </div>
  )
}
