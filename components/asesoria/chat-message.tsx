/**
 * ULE - COMPONENTE DE MENSAJE DE CHAT
 * Mensajes con formato markdown y syntax highlighting
 */

'use client'

import { User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface ChatMessageProps {
  rol: 'USER' | 'ASSISTANT'
  contenido: string
  timestamp: Date | string
  isStreaming?: boolean
}

/**
 * Formatear timestamp
 */
function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: es })
}

/**
 * Mensaje individual en el chat
 */
export function ChatMessage({
  rol,
  contenido,
  timestamp,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = rol === 'USER'

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}
    >
      <div
        className={`flex max-w-[85%] space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
      >
        {/* Avatar */}
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
            ${isUser ? 'bg-indigo-600' : 'bg-gradient-to-br from-purple-600 to-indigo-600'}
          `}
        >
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div
            className={`flex items-center space-x-2 mb-1 ${isUser ? 'justify-end' : ''}`}
          >
            <span className="text-xs font-medium text-gray-700">
              {isUser ? 'Tú' : 'Asesor IA'}
            </span>
            <span className="text-xs text-gray-500">{formatTime(timestamp)}</span>
            {isStreaming && (
              <span className="flex items-center text-xs text-indigo-600">
                <span className="animate-pulse">●</span>
                <span className="ml-1">Escribiendo...</span>
              </span>
            )}
          </div>

          {/* Burbuja de mensaje */}
          <div
            className={`
              rounded-lg px-4 py-3
              ${
                isUser
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }
            `}
          >
            {isUser ? (
              /* Texto simple para mensajes del usuario */
              <p className="text-sm whitespace-pre-wrap break-words">
                {contenido}
              </p>
            ) : (
              /* Markdown con syntax highlighting para IA */
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Renderizar código con syntax highlighting
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      const codeString = String(children).replace(/\n$/, '')

                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-md my-2"
                          {...props}
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      ) : (
                        <code
                          className="bg-gray-100 text-indigo-600 px-1.5 py-0.5 rounded text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      )
                    },
                    // Estilizar enlaces
                    a({ node, children, href, ...props }) {
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 underline"
                          {...props}
                        >
                          {children}
                        </a>
                      )
                    },
                    // Estilizar listas
                    ul({ node, children, ...props }) {
                      return (
                        <ul
                          className="list-disc list-inside space-y-1 my-2"
                          {...props}
                        >
                          {children}
                        </ul>
                      )
                    },
                    ol({ node, children, ...props }) {
                      return (
                        <ol
                          className="list-decimal list-inside space-y-1 my-2"
                          {...props}
                        >
                          {children}
                        </ol>
                      )
                    },
                    // Estilizar párrafos
                    p({ node, children, ...props }) {
                      return (
                        <p className="mb-2 last:mb-0 text-sm" {...props}>
                          {children}
                        </p>
                      )
                    },
                    // Estilizar encabezados
                    h1({ node, children, ...props }) {
                      return (
                        <h1
                          className="text-lg font-bold mt-4 mb-2 first:mt-0"
                          {...props}
                        >
                          {children}
                        </h1>
                      )
                    },
                    h2({ node, children, ...props }) {
                      return (
                        <h2
                          className="text-base font-bold mt-3 mb-2 first:mt-0"
                          {...props}
                        >
                          {children}
                        </h2>
                      )
                    },
                    h3({ node, children, ...props }) {
                      return (
                        <h3
                          className="text-sm font-bold mt-2 mb-1 first:mt-0"
                          {...props}
                        >
                          {children}
                        </h3>
                      )
                    },
                    // Estilizar blockquotes
                    blockquote({ node, children, ...props }) {
                      return (
                        <blockquote
                          className="border-l-4 border-indigo-300 pl-4 py-1 my-2 text-gray-700 italic bg-gray-50"
                          {...props}
                        >
                          {children}
                        </blockquote>
                      )
                    },
                    // Estilizar tablas
                    table({ node, children, ...props }) {
                      return (
                        <div className="overflow-x-auto my-2">
                          <table
                            className="min-w-full divide-y divide-gray-300 border border-gray-300"
                            {...props}
                          >
                            {children}
                          </table>
                        </div>
                      )
                    },
                    th({ node, children, ...props }) {
                      return (
                        <th
                          className="px-3 py-2 text-left text-xs font-medium text-gray-700 bg-gray-50 border-b border-gray-300"
                          {...props}
                        >
                          {children}
                        </th>
                      )
                    },
                    td({ node, children, ...props }) {
                      return (
                        <td
                          className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200"
                          {...props}
                        >
                          {children}
                        </td>
                      )
                    },
                  }}
                >
                  {contenido}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
