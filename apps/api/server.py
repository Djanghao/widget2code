from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os
import yaml
import generator

config_file = os.getenv("CONFIG_FILE", "config.yaml")
config_path = Path(__file__).parent.parent / config_file

with open(config_path, 'r') as f:
    config = yaml.safe_load(f)

app = FastAPI()

allowed_origins = config['cors']['origins']

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.post("/api/generate-widget")(generator.generate_widget)
app.post("/api/generate-widget-text")(generator.generate_widget_text)
app.post("/api/generate-component")(generator.generate_component)
app.post("/api/generate-component-from-image")(generator.generate_component_from_image)
app.post("/api/generate-widget-icons")(generator.generate_widget_with_icons)
app.post("/api/generate-widget-graph")(generator.generate_widget_with_graph)
app.post("/api/generate-widget-full")(generator.generate_widget_full)

if __name__ == "__main__":
    import uvicorn
    port = config['server']['backend_port']
    host = config['server']['host']
    uvicorn.run(app, host=host, port=port)
