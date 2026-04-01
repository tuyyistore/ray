// lib/nexray.js
// ─────────────────────────────────────────────────────────────────────────────
//  Wrapper global untuk api-nexray
//  Semua plugin yang butuh AI / API bisa import dari sini
// ─────────────────────────────────────────────────────────────────────────────

import Nexray from 'api-nexray'
import config from '../config.js'

// Inisialisasi satu instance Nexray yang di-share ke seluruh plugin
const nexray = new Nexray(config.nexrayKey || undefined)

/**
 * Kirim prompt ke AI Nexray dan kembalikan teks responsnya.
 *
 * @param {string} prompt  - Pertanyaan / instruksi ke AI
 * @param {string} [model] - Model Nexray (opsional, default model nexray)
 * @returns {Promise<string>}
 */
export async function askAI(prompt, model) {
  try {
    const result = model
      ? await nexray.ai(prompt, model)
      : await nexray.ai(prompt)

    // api-nexray biasanya mengembalikan { result } atau string langsung
    if (typeof result === 'string') return result
    if (result?.result) return result.result
    return JSON.stringify(result)
  } catch (err) {
    throw new Error(`Nexray AI error: ${err.message}`)
  }
}

/**
 * Cari gambar via Nexray
 *
 * @param {string} query
 * @returns {Promise<string>} URL gambar pertama
 */
export async function searchImage(query) {
  try {
    const result = await nexray.searchImage(query)
    if (Array.isArray(result)) return result[0]
    return result
  } catch (err) {
    throw new Error(`Nexray image error: ${err.message}`)
  }
}

export default nexray
