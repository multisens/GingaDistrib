async function findSepe() {
  try {
    const response = await fetch(
      "http://localhost:44642/tv3/sensory-effect-renderers"
    );

    console.log("Response:", response);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data || !data.renderers || data.renderers.length === 0) {
      return null;
    }

    return data.renderers[0];
  } catch (error) {
    console.error("Error fetching SEPE:", error);
    return null;
  }
}

async function playLightEffect(sepe, action, color) {
  const body = {
    effectType: "LightType",
    action: action,
    properties: [{ name: "color", value: color }],
  };

  const response = fetch(
    "http://localhost:44642/tv3/sensory-effect-renderers/" + sepe.id,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
}

async function execute() {
  console.log("Starting SEPE light effect demo...");
  const sepe = await findSepe();
  console.log("Sepe response:", sepe);
  if (!sepe) {
    console.error("No SEPE found");
  } else {
    console.log("SEPE found:", sepe);
  }

  console.log("Scheduling light effects...");
  if (sepe) {
    setTimeout(() => {
      playLightEffect(sepe, "start", [255, 0, 0]); // Red light
    }, 0);

    setTimeout(() => {
      playLightEffect(sepe, "set", [0, 255, 0]); // Green light
    }, 2000);

    setTimeout(() => {
      playLightEffect(sepe, "set", [0, 0, 255]); // Turn off light
    }, 4000);

    setTimeout(() => {
      playLightEffect(sepe, "stop");
      // Stop light
    }, 6000);
    console.log("Light effects scheduled.");
  } else {
    console.error("No SEPE found, cannot schedule light effects.");
  }
}

execute();
