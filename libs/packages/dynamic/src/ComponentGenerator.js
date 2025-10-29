export async function generateComponent(prompt, suggestedWidth, suggestedHeight, model = null, systemPrompt = null, apiKey = null) {
  try {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('suggested_width', suggestedWidth.toString());
    formData.append('suggested_height', suggestedHeight.toString());
    if (model) {
      formData.append('model', model);
    }
    if (systemPrompt) {
      formData.append('system_prompt', systemPrompt);
    }
    if (apiKey) {
      formData.append('api_key', apiKey);
    }

    const response = await fetch('/api/generate-component', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Generation failed');
    }

    return {
      code: data.code,
      rawResponse: data.raw_response,
      error: null
    };

  } catch (error) {
    console.error('[ComponentGenerator] Error:', error);
    return {
      code: null,
      error: error.message
    };
  }
}

export async function generateComponentFromImage(imageFile, suggestedWidth, suggestedHeight, model = null, systemPrompt = null, apiKey = null) {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('suggested_width', suggestedWidth.toString());
    formData.append('suggested_height', suggestedHeight.toString());
    if (model) {
      formData.append('model', model);
    }
    if (systemPrompt) {
      formData.append('system_prompt', systemPrompt);
    }
    if (apiKey) {
      formData.append('api_key', apiKey);
    }

    const response = await fetch('/api/generate-component-from-image', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Generation failed');
    }

    return {
      code: data.code,
      rawResponse: data.raw_response,
      imageSize: data.image_size,
      error: null
    };

  } catch (error) {
    console.error('[ComponentGenerator] Error:', error);
    return {
      code: null,
      error: error.message
    };
  }
}
