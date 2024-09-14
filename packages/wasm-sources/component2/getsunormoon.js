// Function to return a corresponding image URL based on day or night
export function getsunormoon(dayOrNight) {
  if (dayOrNight === "It's daytime") {
    return "./assets/sun.png"; // Sun image URL for daytime
  } else if (dayOrNight === "It's nighttime") {
    return "./assets/moon.png"; // Moon image URL for nighttime
  }

  // Default image if unable to determine
  return "./assets/default.png";
}
