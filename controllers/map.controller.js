// controllers
// resources
import axios from "axios";
// utils

export async function getlocationImage(req, res) {
  const { lat, lon, size, scale, zoom } = req.query;

  const imageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(
    `${lat},${lon}`
  )}&zoom=${zoom && zoom !== "undefined" ? zoom : 16}&size=${
    size && size !== "undefined" ? size : "600x300"
  }&scale=${
    scale && scale !== "undefined" ? scale : "1"
  }&maptype=roadmap&markers=color:yellow%7Csize:small%7Clabel:%7C${lat},${lon}&style=feature:all%7Csaturation:-80%7Clightness:40&key=${
    process.env.GOOGLE_STATIC_MAPS_API_KEY
  }`;
  try {
    const response = await axios({
      url: imageUrl,
      method: "GET",
      responseType: "arraybuffer",
    });

    return res.json(response.data);
  } catch (error) {
    console.log(error);
    return res.json(error);
  }
}
