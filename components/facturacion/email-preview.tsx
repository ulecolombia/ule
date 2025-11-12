/**
 * ULE - COMPONENTE DE VISTA PREVIA DE EMAIL
 * Muestra cómo se verá el email antes de enviarlo
 */

'use client'

interface EmailPreviewProps {
  destinatario: string
  cc?: string
  asunto: string
  mensaje: string
  adjuntarPdf: boolean
  adjuntarXml: boolean
  numeroFactura: string
}

export function EmailPreview({
  destinatario,
  cc,
  asunto,
  mensaje,
  adjuntarPdf,
  adjuntarXml,
  numeroFactura,
}: EmailPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Email Headers */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-20 flex-shrink-0">
            Para:
          </span>
          <span className="text-sm text-slate-900 dark:text-slate-100 flex-1">
            {destinatario || '(no especificado)'}
          </span>
        </div>

        {cc && cc.trim() && (
          <div className="flex items-start">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-20 flex-shrink-0">
              CC:
            </span>
            <span className="text-sm text-slate-900 dark:text-slate-100 flex-1">
              {cc}
            </span>
          </div>
        )}

        <div className="flex items-start">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-20 flex-shrink-0">
            Asunto:
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-1">
            {asunto}
          </span>
        </div>

        {(adjuntarPdf || adjuntarXml) && (
          <div className="flex items-start">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-20 flex-shrink-0">
              Adjuntos:
            </span>
            <div className="flex flex-wrap gap-2 flex-1">
              {adjuntarPdf && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                  <span className="material-symbols-outlined text-sm">
                    picture_as_pdf
                  </span>
                  Factura-{numeroFactura}.pdf
                </span>
              )}
              {adjuntarXml && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
                  <span className="material-symbols-outlined text-sm">code</span>
                  Factura-{numeroFactura}.xml
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Email Body */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-300">
            {mensaje || '(mensaje vacío)'}
          </pre>
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl flex-shrink-0">
            info
          </span>
          <div className="flex-1">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
              Vista previa del email
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Así es como se verá el email en la bandeja de entrada del
              destinatario. Los archivos adjuntos se incluirán automáticamente
              al enviar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
