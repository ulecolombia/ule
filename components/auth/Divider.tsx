/**
 * ULE - DIVIDER COMPONENT
 * Separador con texto "o"
 */

export function Divider({ text = 'o' }: { text?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300"></div>
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-4 text-sm text-gray-500">{text}</span>
      </div>
    </div>
  )
}
