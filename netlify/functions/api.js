// Agen Rahasia (Netlify Function)
exports.handler = async function (event, context) {
  // 1. Hanya terima request POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 2. Ambil data yang dikirim dari script.js
    const payloadDariWeb = JSON.parse(event.body);

    // 3. SUNTIKKAN KUNCI RAHASIA DARI BRANKAS NETLIFY (Environment Variable)
    payloadDariWeb.api_key = process.env.AKARSA_SECRET_KEY;

    // 4. URL Google Apps Script Bos
    const GAS_URL = "https://script.google.com/macros/s/AKfycbw79f6kuQ2Cgxt-t5EBwA6zy4m1Xp1Cf_8tZF1CcbOCY00OAFFn-yeoWcPx4FRhfDMp/exec";

    // 5. Tembakkan ke Google Apps Script
    const response = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payloadDariWeb),
    });

    const dataDariGAS = await response.json();

    // 6. Kembalikan jawaban dari GAS ke Web App (script.js)
    return {
      statusCode: 200,
      body: JSON.stringify(dataDariGAS),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ status: "ERROR", pesan: "Netlify Gateway Error: " + error.message }),
    };
  }
};