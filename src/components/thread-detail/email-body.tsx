import { useCallback, useRef } from "react"

interface EmailBodyProps {
  bodyHtml: string | null
  bodyText: string | null
}

export function EmailBody({ bodyHtml, bodyText }: EmailBodyProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument?.body) return

    const height = iframe.contentDocument.body.scrollHeight
    iframe.style.height = `${height + 16}px`
  }, [])

  if (bodyHtml) {
    const wrappedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: #1a1a1a;
              margin: 0;
              padding: 0;
              word-break: break-word;
              overflow-wrap: break-word;
              overflow: hidden;
            }
            img { max-width: 100%; height: auto; }
            a { color: #2563eb; }
            pre, code { white-space: pre-wrap; overflow-x: auto; max-width: 100%; }
            table { max-width: 100%; table-layout: fixed; }
            * { max-width: 100%; box-sizing: border-box; }
          </style>
        </head>
        <body>${bodyHtml}</body>
      </html>
    `

    return (
      <div className="w-full min-w-0 overflow-hidden">
        <iframe
          ref={iframeRef}
          srcDoc={wrappedHtml}
          sandbox="allow-same-origin"
          scrolling="no"
          onLoad={handleIframeLoad}
          className="block w-full border-0"
          style={{ minHeight: "100px", overflow: "hidden" }}
          title="Email content"
        />
      </div>
    )
  }

  if (bodyText) {
    return (
      <div className="min-w-0 whitespace-pre-wrap break-words text-sm text-foreground leading-relaxed">
        {bodyText}
      </div>
    )
  }

  return (
    <p className="text-sm italic text-muted-foreground">No content available</p>
  )
}
