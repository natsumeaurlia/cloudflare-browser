import puppeteer from '@cloudflare/puppeteer'
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { nanoid } from 'nanoid'

type Bindings = {
    MYBROWSER: Fetcher
    SCRAPED_DATA_STORE: R2Bucket
  }

const api = new Hono<{ Bindings: Bindings }>().basePath('/api')

api.post(
	'/scrape-urls',
	zValidator(
		'json',
		z.object({
			urls: z.array(z.string()).min(1),
		}),
	),
	async (c) => {
		const { urls } = c.req.valid('json')
        const browser = await puppeteer.launch(c.env.MYBROWSER)
        const page = await browser.newPage()
        // googleに行ってスクリーンショットを撮る
        await page.goto('https://google.com')
        const screenshot = await page.screenshot({
            type: 'png',
            fullPage: true,
        })
		await browser.close();

		try {
			//upload to R2
            const res = await c.env.SCRAPED_DATA_STORE.put(`${nanoid()}.png`, screenshot)

			return new Response(screenshot.buffer, {
				headers: {
					'content-type': 'image/png'
				}
			})
		} catch (e) {
			return new Response('', { status: 400 })
		}
	},
)

export default api
