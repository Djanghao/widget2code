/**
 * Prompt templates for VQA dataset generation
 * Following Qwen3-VL format for grounding (text-to-box) and referring (box-to-text)
 */

/**
 * Grounding task templates (Text-to-Box)
 * User asks to locate an object, model responds with bounding box
 * Placeholder: {description} - description of the element to locate
 */
export const GROUNDING_TEMPLATES = [
  "Please locate the {description} in the image and provide its bounding box in JSON format.",
  "Find the {description} and give me its coordinates as a bounding box.",
  "Where is the {description}? Provide the bounding box.",
  "Locate the {description} and return its position as a bounding box in JSON.",
  "Can you find the {description} and tell me its bounding box coordinates?",
  "Identify the location of the {description} with a bounding box.",
  "Please provide the bounding box for the {description}.",
  "Show me where the {description} is located by giving its bounding box.",
  "What is the bounding box of the {description}?",
  "Give me the coordinates of the {description} in bounding box format."
];

/**
 * Referring task templates (Box-to-Text)
 * User provides coordinates and asks about that region
 * Placeholder: {box} - bounding box coordinates array
 */
export const REFERRING_TEMPLATES = [
  "What is the UI element located at the bounding box {box}?",
  "Describe the element at {box}.",
  "What can you tell me about the component at bounding box {box}?",
  "What UI component is shown at the coordinates {box}?",
  "Identify the element at the bounding box {box}.",
  "What is present in the region defined by {box}?",
  "Describe what you see at the bounding box {box}.",
  "What type of UI element is at the coordinates {box}?",
  "Tell me about the component located at {box}.",
  "What is the element at bounding box {box}?"
];

/**
 * Referring task templates specifically for Text components (Box-to-Text)
 * Placeholder: {box} - bounding box coordinates array
 */
export const REFERRING_TEXT_TEMPLATES = [
  "What is the text content at the bounding box {box}?",
  "Read the text located at {box}.",
  "What does the text say at the coordinates {box}?",
  "Transcribe the text at the bounding box {box}.",
  "What text is shown at {box}?",
  "Tell me the text content at the bounding box {box}.",
  "What is written at the coordinates {box}?",
  "Read what's at the bounding box {box}.",
  "What text appears at {box}?",
  "Describe the text at the bounding box {box}."
];

/**
 * Fill template with values
 * @param {string} template - Template string with placeholders
 * @param {Object} values - Values to fill in {key: value}
 * @returns {string} Filled template
 */
export function fillTemplate(template, values) {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(`{${key}}`, value);
  }
  return result;
}

/**
 * Get all referring questions for a bounding box (Box-to-Text)
 * @param {Array<number>} formattedBox - Formatted bounding box array [x1, y1, x2, y2]
 * @param {boolean} isText - Whether this is a Text component
 * @returns {Array<string>} Array of question variations
 */
export function getReferringQuestions(formattedBox, isText = false) {
  const templates = isText ? REFERRING_TEXT_TEMPLATES : REFERRING_TEMPLATES;
  const boxStr = JSON.stringify(formattedBox);
  return templates.map(template => fillTemplate(template, { box: boxStr }));
}

/**
 * Get all grounding questions for an element description (Text-to-Box)
 * @param {string} description - Element description
 * @returns {Array<string>} Array of question variations
 */
export function getGroundingQuestions(description) {
  return GROUNDING_TEMPLATES.map(template => fillTemplate(template, { description }));
}
