import Ajv from "ajv/dist/2020";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// ── DOM refs ──────────────────────────────────────────────────────────────────
const schemaInput    = document.getElementById("sg-schema-input");
const payloadInput   = document.getElementById("sg-payload-input");
const validateBtn    = document.getElementById("sg-validate-btn");
const resultOutput   = document.getElementById("sg-result-output");
const statusDot      = document.getElementById("sg-status-dot");
const resultConsole  = document.getElementById("sg-result-console");
const btnIntegrate   = document.getElementById("sg-btn-integrate");
const modalOverlay   = document.getElementById("sg-modal");
const btnCloseModal  = document.getElementById("sg-close-modal");
const themeToggle    = document.getElementById("sg-theme-toggle");
const htmlEl         = document.documentElement;

// ── Theme ─────────────────────────────────────────────────────────────────────
themeToggle.addEventListener("click", () => {
  const current = htmlEl.getAttribute("data-sg-theme");
  htmlEl.setAttribute("data-sg-theme", current === "dark" ? "light" : "dark");
});

// ── Modal ─────────────────────────────────────────────────────────────────────
btnIntegrate.addEventListener("click", () => modalOverlay.classList.remove("sg-hidden"));
btnCloseModal.addEventListener("click", () => modalOverlay.classList.add("sg-hidden"));
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.add("sg-hidden");
});

// ── JSON helpers ──────────────────────────────────────────────────────────────
function safeParse(raw) {
  try {
    let s = raw
      .replace(/\s\/\/.*/g, "")        // inline comments
      .replace(/^\/\/.*/gm, "")        // leading-comment lines
      .replace(/,(\s*[}\]])/g, "$1");  // trailing commas
    return { data: JSON.parse(s), error: null };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

// ── Validation ────────────────────────────────────────────────────────────────
validateBtn.addEventListener("click", () => {
  // Reset state
  resultOutput.className = "sg-console__body";
  statusDot.className    = "sg-status-dot";
  resultConsole.classList.remove("sg-console--success", "sg-console--error");
  resultOutput.textContent = "Intercepting Kafka producer request…\n";

  const schemaRes  = safeParse(schemaInput.value);
  const payloadRes = safeParse(payloadInput.value);

  if (schemaRes.error)  { showError(`Failed to parse JSON Schema:\n${schemaRes.error}`);  return; }
  if (payloadRes.error) { showError(`Failed to parse Payload:\n${payloadRes.error}`);     return; }

  try {
    const validate = ajv.compile(schemaRes.data);
    const valid    = validate(payloadRes.data);

    if (valid) {
      showSuccess("✅  VALIDATION PASSED\n\nEvent forwarded to Kafka broker successfully.");
    } else {
      const lines = validate.errors.map((err) => {
        if (err.keyword === "required")
          return `  [MissingField]          '${err.params.missingProperty}' is required`;
        return `  [SchemaValidationError] '${err.instancePath}' ${err.message}`;
      });
      showError(`🚫  POISON PILL BLOCKED by Schema Guard\n\nValidation errors:\n${lines.join("\n")}`);
    }
  } catch (e) {
    showError(`Schema compilation error:\n${e.message}`);
  }
});

function showSuccess(msg) {
  resultOutput.textContent = msg;
  resultOutput.classList.add("sg-console__body--success");
  statusDot.classList.add("sg-status-dot--success");
  resultConsole.classList.add("sg-console--success");
}

function showError(msg) {
  resultOutput.textContent = msg;
  resultOutput.classList.add("sg-console__body--error");
  statusDot.classList.add("sg-status-dot--error");
  resultConsole.classList.add("sg-console--error");
  // shake animation
  resultConsole.classList.remove("sg-shake");
  void resultConsole.offsetWidth;
  resultConsole.classList.add("sg-shake");
}
