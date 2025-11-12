/**
 * ULE - BOTONES DE AUTENTICACIÓN SOCIAL
 * Botones para login con Google y Apple
 */

'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'

interface SocialLoginButtonsProps {
  callbackUrl?: string
}

export function SocialLoginButtons({ callbackUrl = '/dashboard' }: SocialLoginButtonsProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isAppleLoading, setIsAppleLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      await signIn('google', { callbackUrl })
    } catch (error) {
      toast.error('Error al iniciar sesión con Google')
      setIsGoogleLoading(false)
    }
  }

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true)
    try {
      await signIn('apple', { callbackUrl })
    } catch (error) {
      toast.error('Error al iniciar sesión con Apple')
      setIsAppleLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Google Sign In */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isAppleLoading}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGoogleLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            <span className="font-medium text-gray-700">Conectando...</span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
              <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
              <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
              <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
            </svg>
            <span className="font-medium text-gray-700">Continuar con Google</span>
          </>
        )}
      </button>

      {/* Apple Sign In */}
      <button
        type="button"
        onClick={handleAppleSignIn}
        disabled={isGoogleLoading || isAppleLoading}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAppleLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
            <span className="font-medium">Conectando...</span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.175 13.35c-.237.563-.513 1.075-.825 1.538-.425.625-.775 1.062-1.05 1.312-.425.4-.887.6-1.387.612-.35 0-.775-.1-1.263-.3-.5-.2-.962-.3-1.387-.3-.45 0-.925.1-1.438.3-.512.2-.925.312-1.237.325-.475.025-.95-.188-1.425-.625-.3-.275-.663-.725-1.1-1.363-.475-.687-.862-1.487-1.163-2.4-.325-.987-.487-1.937-.487-2.85 0-1.05.225-1.962.675-2.737.35-.612.825-1.1 1.413-1.462.587-.363 1.225-.55 1.912-.563.375 0 .875.113 1.488.35.612.237 1 .35 1.162.35.125 0 .562-.138 1.3-.412.7-.25 1.287-.35 1.775-.313 1.312.113 2.3.662 2.95 1.663-1.175.712-1.75 1.712-1.738 3-.013 1 .375 1.837 1.15 2.525.363.313.763.55 1.213.713-.1.287-.2.563-.313.837zM13.7 1.137c0 .788-.287 1.525-.862 2.213-.687.812-1.525 1.287-2.425 1.2-.012-.1-.025-.2-.025-.313 0-.75.325-1.562.9-2.225.287-.337.65-.612 1.087-.825.438-.213.85-.338 1.238-.375.012.113.025.225.025.325z"/>
            </svg>
            <span className="font-medium">Continuar con Apple</span>
          </>
        )}
      </button>
    </div>
  )
}
