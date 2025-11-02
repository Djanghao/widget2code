from pathlib import Path

WIDGET2DSL_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "widget2dsl" / "widget2dsl.md"
WIDGET2DSL_GRAPH_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "widget2dsl" / "widget2dsl-graph-modified.md"
PROMPT2DSL_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "prompt2dsl" / "prompt2dsl-sf-lucide.md"
DYNAMIC_COMPONENT_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "dynamic" / "prompt2react" / "dynamic-component-prompt.md"
DYNAMIC_COMPONENT_IMAGE_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "dynamic" / "image2react" / "dynamic-component-image-prompt.md"

def load_default_prompt():
    return load_widget2dsl_prompt()

def load_widget2dsl_prompt():
    if WIDGET2DSL_PROMPT_PATH.exists():
        return WIDGET2DSL_PROMPT_PATH.read_text(encoding="utf-8")
    return ""

def load_widget2dsl_graph_prompt():
    if WIDGET2DSL_GRAPH_PROMPT_PATH.exists():
        return WIDGET2DSL_GRAPH_PROMPT_PATH.read_text(encoding="utf-8")
    return ""

def load_prompt2dsl_prompt():
    if PROMPT2DSL_PROMPT_PATH.exists():
        return PROMPT2DSL_PROMPT_PATH.read_text(encoding="utf-8")
    return ""

def load_dynamic_component_prompt():
    if DYNAMIC_COMPONENT_PROMPT_PATH.exists():
        return DYNAMIC_COMPONENT_PROMPT_PATH.read_text(encoding="utf-8")
    return ""

def load_dynamic_component_image_prompt():
    if DYNAMIC_COMPONENT_IMAGE_PROMPT_PATH.exists():
        return DYNAMIC_COMPONENT_IMAGE_PROMPT_PATH.read_text(encoding="utf-8")
    return ""
