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
            flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full
            ${isUser ? 'bg-indigo-600' : 'bg-gradient-to-br from-purple-600 to-indigo-600'}
          `}
        >
          {isUser ? (
            <User className="h-5 w-5 text-white" />
          ) : (
            <Bot className="h-5 w-5 text-white" />
          )}
        </div>

        {/* Contenido */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div
            className={`mb-1 flex items-center space-x-2 ${isUser ? 'justify-end' : ''}`}
          >
            <span className="text-xs font-medium text-gray-700">
              {isUser ? 'Tú' : 'Asesor IA'}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(timestamp)}
            </span>
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
                  : 'border border-gray-200 bg-white text-gray-900'
              }
            `}
          >
            {isUser ? (
              /* Texto simple para mensajes del usuario */
              <p className="whitespace-pre-wrap break-words text-sm">
                {contenido}
              </p>
            ) : (
              /* Markdown con syntax highlighting para IA */
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Renderizar código con syntax highlighting
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      const codeString = String(children).replace(/\n$/, '')
                      const isBlock = match !== null

                      return isBlock ? (
                        <SyntaxHighlighter
                          style={
                            vscDarkPlus as {
                              [key: string]: React.CSSProperties
                            }
                          }
                          language={match[1]}
                          PreTag="div"
                          className="my-2 rounded-md"
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      ) : (
                        <code
                          className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-indigo-600"
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
                          className="text-indigo-600 underline hover:text-indigo-800"
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
                          className="my-2 list-inside list-disc space-y-1"
                          {...props}
                        >
                          {children}
                        </ul>
                      )
                    },
                    ol({ node, children, ...props }) {
                      return (
                        <ol
                          className="my-2 list-inside list-decimal space-y-1"
                          {...props}
                        >
                          {children}
                        </ol>
                      )
                    },
                    // Estilizar párrafos
                    p({ node, children, ...props }) {
                      return (
                        <p className="mb-2 text-sm last:mb-0" {...props}>
                          {children}
                        </p>
                      )
                    },
                    // Estilizar encabezados
                    h1({ node, children, ...props }) {
                      return (
                        <h1
                          className="mb-2 mt-4 text-lg font-bold first:mt-0"
                          {...props}
                        >
                          {children}
                        </h1>
                      )
                    },
                    h2({ node, children, ...props }) {
                      return (
                        <h2
                          className="mb-2 mt-3 text-base font-bold first:mt-0"
                          {...props}
                        >
                          {children}
                        </h2>
                      )
                    },
                    h3({ node, children, ...props }) {
                      return (
                        <h3
                          className="mb-1 mt-2 text-sm font-bold first:mt-0"
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
                          className="my-2 border-l-4 border-indigo-300 bg-gray-50 py-1 pl-4 italic text-gray-700"
                          {...props}
                        >
                          {children}
                        </blockquote>
                      )
                    },
                    // Estilizar tablas
                    table({ node, children, ...props }) {
                      return (
                        <div className="my-2 overflow-x-auto">
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
                          className="border-b border-gray-300 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-700"
                          {...props}
                        >
                          {children}
                        </th>
                      )
                    },
                    td({ node, children, ...props }) {
                      return (
                        <td
                          className="border-b border-gray-200 px-3 py-2 text-sm text-gray-900"
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
