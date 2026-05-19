import { FC } from 'react'

interface HighlightedTextProps {
  text: string
  query: string
}

const HighlightedText: FC<HighlightedTextProps> = ({ text, query }) => {
  const trimmed = query.trim()
  if (trimmed === '') return <>{text}</>

  const lowerText = text.toLowerCase()
  const lowerQuery = trimmed.toLowerCase()
  const idx = lowerText.indexOf(lowerQuery)

  if (idx === -1) return <>{text}</>

  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + trimmed.length)
  const after = text.slice(idx + trimmed.length)

  return (
    <>
      {before}
      <mark className="bg-yellow-500/30 text-foreground rounded px-0.5">{match}</mark>
      {after}
    </>
  )
}

export default HighlightedText
