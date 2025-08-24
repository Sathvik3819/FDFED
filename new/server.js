import express from "express";
import path from "path";

import { fileURLToPath } from "url";
import bodyParser from "express";
import session from "express-session";
import mongoose from "mongoose";

import flash from "connect-flash";

import dotenv from "dotenv";
dotenv.config();

import multer from "multer";

import auth from "./controllers/auth.js";

import {
  authorizeR,
  authorizeS,
  authorizeW,
  authorizeC,
  authorizeA,
} from "./controllers/authorization.js";
import {
  authenticateC,
  authenticateR,
  authenticateS,
  authenticateW,
} from "./controllers/registerController.js";
import {
  AuthenticateC,
  AuthenticateR,
  AuthenticateS,
  AuthenticateW,
  AuthenticateA,
} from "./controllers/loginController.js";

dotenv.config();

import cookieParser from "cookie-parser";

const communities = [
  {
    name: "Skyline Elite",
    location: "Gurgaon, Haryana",
    image:
      "https://th.bing.com/th/id/OIP.XCknuV3fq5T8j3M7rPyUGQHaDy?w=339&h=178&c=7&r=0&o=5&dpr=1.5&pid=1.7",
    amenities: [
      "Smart Home Automation",
      "Private Rooftop Lounge",
      "Tennis Court",
    ],
    description:
      "A luxurious high-rise with stunning city views, featuring cutting-edge smart home technology.",
  },
  {
    name: "Green Habitat",
    location: "Chennai, Tamil Nadu",
    image:
      "https://th.bing.com/th/id/OIP.TGVXc84nlyJ1SDpxdor0QwHaE-?w=226&h=180&c=7&r=0&o=5&dpr=1.5&pid=1.7",
    amenities: [
      "Organic Farming Space",
      "Electric Vehicle Charging Stations",
      "Amphitheater",
    ],
    description:
      "An environmentally friendly community offering sustainability and modern living.",
  },
  {
    name: "Horizon Towers",
    location: "Hyderabad, Telangana",
    image:
      "https://th.bing.com/th/id/OIP.E474VpdAAkzzPi5k6D8segHaES?w=314&h=182&c=7&r=0&o=5&dpr=1.5&pid=1.7",
    amenities: ["Co-working Spaces", "Pet-Friendly Zone", "Mini Theater"],
    description:
      "A smart community designed for professionals and families, blending work and leisure effortlessly.",
  },
  {
    name: "Serene Meadows",
    location: "Bengaluru, Karnataka",
    image:
      "https://th.bing.com/th/id/OIP.phuGZCk8fOSGEuhAjJyiPAHaFF?w=213&h=180&c=7&r=0&o=5&dpr=1.5&pid=1.7",
    amenities: ["Tennis Court", "Smart Home Automation", "Pet-Friendly Zone"],
    description:
      "A peaceful gated community with modern villas, smart home automation, and green landscapes.",
  },
  {
    name: "Royal Greens",
    location: "Jaipur, Rajasthan",
    image:
      "https://th.bing.com/th/id/OIP.EBz1Pcpw1AD0pNFACwtTXgHaEc?w=274&h=180&c=7&r=0&o=5&dpr=1.5&pid=1.7",
    amenities: ["Amphitheater", "Co-working Spaces", "Private Rooftop Lounge"],
    description:
      "A luxurious residential enclave inspired by Rajasthan’s royal heritage and modern architecture.",
  },
  {
    name: "Eco Nirvana",
    location: "Pune, Maharashtra",
    image:
      "https://th.bing.com/th/id/OIP.ZPQGmpkZE-H4B99k5DMKxQHaDr?w=286&h=173&c=7&r=0&o=5&dpr=1.5&pid=1.7",
    amenities: [
      "Organic Farming Space",
      "Electric Vehicle Charging Stations",
      "Pet-Friendly Zone",
    ],
    description:
      "An eco-friendly township focused on sustainable living with ample greenery and renewable energy solutions.",
  },
  {
    name: "Skylife Heights",
    location: "Mumbai, Maharashtra",
    image:
      "https://th.bing.com/th/id/OIP.R8PHppVJK2cK0n7a7Fge7AHaEK?w=322&h=181&c=7&r=0&o=5&dpr=1.5&pid=1.7",
    amenities: [
      "Private Rooftop Lounge",
      "Mini Theater",
      "Smart Home Automation",
    ],
    description:
      "A high-rise luxury community with breathtaking cityscape views and world-class amenities.",
  },
  {
    name: "Tranquil Woods",
    location: "Dehradun, Uttarakhand",
    image:
      "https://th.bing.com/th/id/OIP.TyDKsBV8a1oev3lR4lRDtwHaE8?w=224&h=180&c=7&r=0&o=5&dpr=1.5&pid=1.7",
    amenities: ["Yoga Pavilion", "Nature Trails", "Amphitheater"],
    description:
      "A serene residential retreat nestled in the Himalayas, offering a perfect blend of nature and comfort.",
  },
  {
    name: "Heritage Villas",
    location: "Kolkata, West Bengal",
    image:
      "https://th.bing.com/th/id/OIP.zf4o8W7RXs37TaJZ4HvYQAHaEB?w=285&h=180&c=7&r=0&o=5&dpr=1.5&pid=1.7",
    amenities: ["Tennis Court", "Mini Theater", "Pet-Friendly Zone"],
    description:
      "A charming community blending classic Bengali architecture with modern conveniences.",
  },
];

mongoose.connect(process.env.MONGO_URI1).then(() => {
  console.log("database connected");
});

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.alert = req.flash("alert-msg");
  next();
});

app.use("/uploads", express.static("uploads"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});


// Set up EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/uploads", express.static("uploads"));
import AdminRouter from "./routes/adminRouter.js";
import residentRouter from "./routes/residentRouter.js";
import securityRouter from "./routes/securityRouter.js";
import workerRouter from "./routes/workerRouter.js";
import managerRouter from "./routes/managerRouter.js";
import interestRouter from "./routes/InterestRouter.js"
import Ad from "./models/Ad.js";

// Routes
app.use("/admin", auth, authorizeA, AdminRouter);
app.use("/resident", auth, authorizeR, residentRouter);

app.use("/security", auth, authorizeS, securityRouter);

app.use("/worker", auth, authorizeW, workerRouter);

app.use("/manager", auth, authorizeC, managerRouter);

app.use("/interest",interestRouter)
// Start server
const PORT = 3000;

// Render the homepage with communities data
app.get("/", (req, res) => {
  res.render("Landing_Page", { communities: communities.slice(0, 9) });
});


// Render the login page
app.get("/login", (req, res) => {
  res.render("LoginPage", { message: req.flash("message") });
});
app.get("/AdminLogin", (req, res) => {
  res.render("adminLogin", { message: req.flash("message") });
});
app.get("/AdminLogin", (req, res) => {
  res.render("admin-login", { 
    message: req.flash("message") 
  });
});

app.post("/AdminLogin", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Admin login attempt:", req.body);

    const result = await AuthenticateA(email, password, req, res);
    
    if (result) {
      return res.redirect("/admin");
    } else {
      req.flash("message", "Invalid email or password");
      return res.redirect("/AdminLogin");
    }
  } catch (error) {
    console.error("Admin login error:", error);
    req.flash("message", "Server error during login");
    return res.redirect("/AdminLogin");
  }
});
app.post("/login", async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    console.log(req.body);

    let result;
    switch (userType) {
      case "Resident":
        result = await AuthenticateR(email, password, req, res);
        return result
          ? res.redirect("/resident/dashboard")
          : res.redirect("/login");

      case "Security":
        result = await AuthenticateS(email, password, req, res);
        return result
          ? res.redirect("/security/dashboard")
          : res.redirect("/login");

      case "Worker":
        result = await AuthenticateW(email, password, req, res);
        return result
          ? res.redirect("/worker/dashboard")
          : res.redirect("/login");

      case "communityManager":
        result = await AuthenticateC(email, password, req, res);

        // If result is an object with redirect property
        if (result && typeof result === "object" && result.redirect) {
          return res.redirect(result.redirect);
        }

        // Otherwise handle normally
        return result
          ? res.redirect("/manager/dashboard")
          : res.redirect("/login");
      default:
        console.log("Invalid user type");
        return res.redirect("/register");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});
app.get("/logout", (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/login");
  }

  res.clearCookie("token");

  // Redirect to login instead of sending JSON
  res.redirect("/login");
});


app.listen(PORT, async () => {
  const ads = await Ad.find({});
  ads.forEach(async (ad) => {
    const d = new Date(Date.now())
    const endDate = new Date(ad.endDate)

    if (d === ad.startDate) {
      ad.status = "active";
    } else if (d > ad.endDate) { 
      ad.status = "expired";
    }else{
      ad.status = "active";
    }
    await ad.save();
  });




  

  console.log(`Server running at http://localhost:${PORT}`);
});
