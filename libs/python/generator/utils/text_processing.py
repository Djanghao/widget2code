def clean_json_response(text: str) -> str:
    result = text.strip()

    if result.startswith("```json"):
        result = result[7:]
    if result.startswith("```"):
        result = result[3:]
    if result.endswith("```"):
        result = result[:-3]

    return result.strip()


def clean_code_response(code: str) -> str:
    result = code.strip()

    if result.startswith("```jsx") or result.startswith("```javascript"):
        result = result.split('\n', 1)[1] if '\n' in result else result
    if result.startswith("```"):
        result = result.split('\n', 1)[1] if '\n' in result else result
    if result.endswith("```"):
        result = result.rsplit('\n', 1)[0] if '\n' in result else result

    return result.strip()
