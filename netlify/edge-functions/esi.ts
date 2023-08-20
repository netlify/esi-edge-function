import type { Config, Context } from "https://edge.netlify.com";

type Replacer = (match: string, ...args: any[]) => Promise<string> ;

async function replaceInStream(
    body: ReadableStream<Uint8Array>,
    search: RegExp,
    replace: Replacer,
    maxLength: Number = 256
  ): Promise<ReadableStream<Uint8Array>> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
  
    let leftover = "";
  
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const transformStream = new TransformStream<Uint8Array, Uint8Array>({
          async transform(chunk, transformerController) {
            let chunkStr = decoder.decode(chunk, { stream: true });
  
            // Prepend any leftover from the last chunk
            chunkStr = leftover + chunkStr;
  
            let match: null | RegExpExecArray = null; 
            while ((match = search.exec(chunkStr)) ) {
              const replacement = await replace(match[0], ...match.slice(1));
              chunkStr = chunkStr.replace(match[0], replacement);
            }
  
            // Store the end of this chunk to check with the next chunk
            leftover = chunkStr.slice(-256 + 1);
  
            transformerController.enqueue(encoder.encode(chunkStr.slice(0, -maxLength + 1)));
          },
          flush(transformerController) {
            if (leftover) {
              transformerController.enqueue(encoder.encode(leftover));
            }
          },
        });
  
        body.pipeThrough(transformStream).pipeTo(new WritableStream({
          write(chunk) {
            controller.enqueue(chunk);
          },
          close() {
            controller.close();
          },
          abort(err) {
            controller.error(err);
          },
        }));
      },
    });
  }  

export default async (request: Request, context: Context) => {
    const url = new URL(request.url)
    if (url.pathname.match(/\..+$/)) {
        return;
    }

    const esi = new RegExp(/<esi:include\s*src="([^"]+)"\s*\/>/g);

    const response = await context.next(request);
    const bodyStream = await replaceInStream(response.body!, esi, async (match, src) => {
        const url = src.match(/^https?:/) ? src : new URL(src, request.url);
        const resp = await fetch(url.toString());
        return await resp.text();
    });

    return new Response(bodyStream, response);
}

export const config: Config = { path: "/*" };
