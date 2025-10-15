import asyncio
import base64
import json
import os
from pathlib import Path
from typing import Optional, Dict, Any
from playwright.async_api import async_playwright, Browser, BrowserContext, Page

class PlaywrightRenderer:
    def __init__(self, max_workers: int = 4, frontend_url: str = "http://localhost:5173"):
        self.max_workers = max_workers
        self.frontend_url = frontend_url
        self.browser: Optional[Browser] = None
        self.contexts: list[BrowserContext] = []
        self.semaphore = asyncio.Semaphore(max_workers)

    async def start(self):
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )

        for _ in range(self.max_workers):
            context = await self.browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                device_scale_factor=2
            )
            self.contexts.append(context)

    async def stop(self):
        if self.contexts:
            for context in self.contexts:
                await context.close()
            self.contexts = []

        if self.browser:
            await self.browser.close()
            self.browser = None

    async def render_widget(self, spec: Dict[str, Any], timeout: int = 30000) -> Dict[str, Any]:
        async with self.semaphore:
            context = self.contexts[0] if self.contexts else await self.browser.new_context()

            try:
                page = await context.new_page()

                page.on("console", lambda msg: print(f"[Browser] {msg.type}: {msg.text}"))

                await page.goto(f"{self.frontend_url}/render.html", wait_until="networkidle")

                await page.wait_for_function("window.renderWidget !== undefined", timeout=10000)

                result = await asyncio.wait_for(
                    page.evaluate(f"window.renderWidget({json.dumps(spec)})"),
                    timeout=timeout / 1000
                )

                await page.close()

                return result

            except Exception as e:
                if 'page' in locals():
                    await page.close()
                raise e

    async def render_batch(self, specs: list[Dict[str, Any]], timeout: int = 30000) -> list[Dict[str, Any]]:
        tasks = [self.render_widget(spec, timeout) for spec in specs]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "success": False,
                    "error": str(result),
                    "index": i
                })
            else:
                processed_results.append({
                    "success": True,
                    "data": result,
                    "index": i
                })

        return processed_results

renderer_instance: Optional[PlaywrightRenderer] = None

async def get_renderer(max_workers: int = 4) -> PlaywrightRenderer:
    global renderer_instance
    if renderer_instance is None:
        frontend_port = os.getenv("FRONTEND_PORT", "5173")
        renderer_instance = PlaywrightRenderer(
            max_workers=max_workers,
            frontend_url=f"http://localhost:{frontend_port}"
        )
        await renderer_instance.start()
    return renderer_instance

async def shutdown_renderer():
    global renderer_instance
    if renderer_instance:
        await renderer_instance.stop()
        renderer_instance = None
