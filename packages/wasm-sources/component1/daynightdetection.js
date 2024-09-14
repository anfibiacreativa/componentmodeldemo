export function daynightdetection(input) {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes("morning")) {
    return "It's daytime";
  } else if (lowerInput.includes("evening") || lowerInput.includes("night")) {
    return "It's nighttime";
  }

  // Default response
  return "Unable to determine time of day";
}
