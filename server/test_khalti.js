import "dotenv/config";

const testKhaltiPayment = async () => {
  const khaltiPayload = {
    return_url: "http://localhost:5173/khalti-callback",
    website_url: "http://localhost:5173",
    amount: 250000, // 2500 * 100
    purchase_order_id: "test-order-123",
    purchase_order_name: "Subscription: monthly",
    customer_info: {
      name: "Test Student",
      email: "test@example.com",
      phone: "9800000000"
    }
  };

  console.log("Testing Khalti API with payload:", JSON.stringify(khaltiPayload, null, 2));
  console.log("Authorization Key:", process.env.KHALTI_SECRET_KEY);

  try {
    const khaltiResponse = await fetch("https://dev.khalti.com/api/v2/epayment/initiate/", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(khaltiPayload)
    });

    console.log("Response Status:", khaltiResponse.status);
    console.log("Response Headers:", Object.fromEntries(khaltiResponse.headers));

    let khaltiData;
    const responseText = await khaltiResponse.text();
    console.log("Raw Response:", responseText);

    try {
      khaltiData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse JSON:", e.message);
      return;
    }

    console.log("Parsed Response:", JSON.stringify(khaltiData, null, 2));

    if (!khaltiResponse.ok) {
      console.error("API Error:", khaltiData);
      return;
    }

    console.log("Success! Payment URL:", khaltiData.payment_url);
    console.log("PIDX:", khaltiData.pidx);
  } catch (err) {
    console.error("Network Error:", err.message);
  }
};

testKhaltiPayment();
