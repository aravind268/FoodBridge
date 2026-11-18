
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const { authenticateToken, allowRoles } = require("./middleware/auth");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

// Donation schema

const donationSchema = new mongoose.Schema(
    {
        foodName: {
            type: String,
            required: true,
            trim: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0.1,
            max: 500
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 200
        },
        foodImage: { type: String, default: "" },
        preparedAt: { type: String, required: true },
        pickupDeadline: { type: String, required: true },
        storage: {
            type: String,
            enum: ["hot", "refrigerated", "room-temperature"],
            required: true
        },
        restaurantName: { type: String, default: "" },
        donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true
},
        pickupAddress: { type: String, default: "" },
        contactPhone: { type: String, default: "" },
        mapsLink: { type: String, default: "" },
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
        status: {
            type: String,
            enum: ["Available", "Reserved", "Collected", "Delivered"],
            default: "Available"
        },
        reservedBy: { type: String, default: "" },
        ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true
},
ngoPhone: { type: String, default: "" },
deliveryAddress: { type: String, default: "" },
reservedAt: { type: Date, default: null },
volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true
},
volunteerName: { type: String, default: "" },
volunteerPhone: { type: String, default: "" },
        collectedAt: { type: Date, default: null },
        deliveredAt: { type: Date, default: null },
        deliveredBy: { type: String, default: "" },
        ngoConfirmedAt: { type: Date, default: null }
    },
    { timestamps: true }
);

const Donation = mongoose.model("Donation", donationSchema);

// Home route
app.get("/", function (req, res) {
    res.json({
        message: "FoodBridge backend is running!"
    });
});

// Get all donations from MongoDB
app.get("/api/donations", async function (req, res) {
    try {
        const donations = await Donation.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            count: donations.length,
            donations: donations
        });
    } catch (error) {
        console.error("Fetch error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve donations."
        });
    }
});
// Get donations belonging to the logged-in donor
app.get(
    "/api/donations/my",
    authenticateToken,
    allowRoles("donor"),
    async function (req, res) {
        try {
            const donations = await Donation.find({
                donorId: req.user.id
            }).sort({ createdAt: -1 });

            res.json({
                success: true,
                count: donations.length,
                donations: donations
            });
        } catch (error) {
            console.error("My donations fetch error:", error.message);

            res.status(500).json({
                success: false,
                message: "Failed to retrieve your donations."
            });
        }
    }
);

 // Reserve a donation in MongoDB
app.patch(
    "/api/donations/:id/reserve",
    authenticateToken,
    allowRoles("ngo"),
    async function (req, res) {
    try {
        const { id } = req.params;
        const { ngoName, ngoPhone, deliveryAddress } = req.body;

        if (!ngoName || !ngoPhone || !deliveryAddress) {
            return res.status(400).json({
                success: false,
                message: "NGO name, phone, and delivery address are required."
            });
        }

        const donation = await Donation.findOneAndUpdate(
            {
                _id: id,
                status: "Available"
            },
            {
                
$set: {
    status: "Reserved",
    ngoId: req.user.id,
    reservedBy: req.user.name,
    ngoPhone: ngoPhone,
    deliveryAddress: deliveryAddress,
    reservedAt: new Date()
}

            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!donation) {
            return res.status(409).json({
                success: false,
                message: "Donation is unavailable or has already been reserved."
            });
        }

        res.json({
            success: true,
            message: "Food reserved successfully!",
            donation: donation
        });
    } catch (error) {
        console.error("Reservation error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to reserve donation."
        });
    }
});

// Get reservations belonging to the logged-in NGO
app.get(
    "/api/donations/my-reservations",
    authenticateToken,
    allowRoles("ngo"),
    async function (req, res) {
        try {
            const donations = await Donation.find({
                ngoId: req.user.id
            }).sort({ reservedAt: -1 });

            res.json({
                success: true,
                count: donations.length,
                donations: donations
            });
        } catch (error) {
            console.error("My reservations fetch error:", error.message);

            res.status(500).json({
                success: false,
                message: "Failed to retrieve your reservations."
            });
        }
    }
);


// Mark a reserved donation as collected
app.patch(
    "/api/donations/:id/collect",
    authenticateToken,
    allowRoles("volunteer"),
    async function (req, res) {
        try {
            const { id } = req.params;

            // Get volunteer details from the authenticated account
            const volunteerName = req.user.name;
            const volunteerPhone = req.user.phone;

            if (
                !volunteerName ||
                !/^[6-9][0-9]{9}$/.test(volunteerPhone || "")
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please update your account with a valid 10-digit phone number."
                });
            }

            const donation = await Donation.findOneAndUpdate(
                {
                    _id: id,
                    status: "Reserved"
                },
                {
                    $set: {
    status: "Collected",
    volunteerId: req.user.id,
    volunteerName: volunteerName,
    volunteerPhone: volunteerPhone,
    collectedAt: new Date()
}
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!donation) {
                return res.status(409).json({
                    success: false,
                    message: "Donation is not awaiting collection."
                });
            }

            res.json({
                success: true,
                message: "Food marked as collected!",
                donation: donation
            });
        } catch (error) {
            console.error("Collection error:", error.message);

            res.status(500).json({
                success: false,
                message: "Failed to update collection status."
            });
        }
    }
);


 // Mark a collected donation as delivered
app.patch(
    "/api/donations/:id/deliver",
    authenticateToken,
    allowRoles("volunteer"),
    async function (req, res) {
        try {
            const { id } = req.params;

            // Get the authenticated volunteer's details
            const volunteerName = req.user.name;

            const donation = await Donation.findOneAndUpdate(
                {
                    _id: id,
                    status: "Collected",
                    volunteerId: req.user.id
                },
                {
                    $set: {
                        status: "Delivered",
                        deliveredBy: volunteerName,
                        deliveredAt: new Date(),
                        ngoConfirmedAt: null
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!donation) {
                return res.status(409).json({
                    success: false,
                    message: "Donation is not awaiting delivery or it was collected by another volunteer."
                });
            }

            res.json({
                success: true,
                message: "Delivery recorded. NGO confirmation is pending.",
                donation: donation
            });
        } catch (error) {
            console.error("Delivery error:", error.message);

            res.status(500).json({
                success: false,
                message: "Failed to update delivery status."
            });
        }
    }
);


/* NGO confirms receipt of delivered food */

app.patch(
    "/api/donations/:id/confirm-receipt",
    authenticateToken,
    allowRoles("ngo"),
    async function (req, res) {
        try {
            const { id } = req.params;

            const donation = await Donation.findOneAndUpdate(
                {
                    _id: id,
                    status: "Delivered",
                    ngoId: req.user.id,
                    ngoConfirmedAt: null
                },
                {
                    $set: {
                        ngoConfirmedAt: new Date()
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!donation) {
                return res.status(409).json({
                    success: false,
                    message: "Donation cannot be confirmed. Check its delivery status and authorization."
                });
            }

            res.json({
                success: true,
                message: "Receipt confirmed successfully!",
                donation: donation
            });
        } catch (error) {
            console.error("Receipt confirmation error:", error.message);

            res.status(500).json({
                success: false,
                message: "Failed to confirm receipt."
            });
        }
    }
);



// Add a donation to MongoDB

app.post("/api/donations", authenticateToken, allowRoles("donor"), async function (req, res) {
    try {
        const {
            foodName,
            quantity,
            description,
            foodImage,
            preparedAt,
            pickupDeadline,
            storage,
            restaurantName,
            pickupAddress,
            contactPhone,
            mapsLink,
            latitude,
            longitude
        } = req.body;

        if (
            typeof foodName !== "string" ||
            !foodName.trim() ||
            quantity === undefined ||
            quantity === null ||
            quantity === "" ||
            !Number.isFinite(Number(quantity)) ||
            Number(quantity) < 0.1 ||
            Number(quantity) > 500 ||
            typeof description !== "string" ||
            description.trim().length < 10 ||
            description.trim().length > 200 ||
            !preparedAt ||
            !pickupDeadline ||
            !["hot", "refrigerated", "room-temperature"].includes(storage)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid food details, quantity, description, dates, and storage."
            });
        }

        const preparedDate = new Date(preparedAt);
        const deadlineDate = new Date(pickupDeadline);

        if (
            Number.isNaN(preparedDate.getTime()) ||
            Number.isNaN(deadlineDate.getTime()) ||
            preparedDate > new Date() ||
            deadlineDate <= preparedDate ||
            deadlineDate <= new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "Preparation and pickup dates are invalid."
            });
        }

       const donation = await Donation.create({
    donorId: req.user.id,
    foodName: foodName.trim(),
            quantity: Number(quantity),
            description: description.trim(),
            foodImage: typeof foodImage === "string" ? foodImage.trim() : "",
            preparedAt,
            pickupDeadline,
            storage,
            restaurantName: typeof restaurantName === "string" ? restaurantName.trim() : "",
            pickupAddress: typeof pickupAddress === "string" ? pickupAddress.trim() : "",
            contactPhone: typeof contactPhone === "string" ? contactPhone.trim() : "",
            mapsLink: typeof mapsLink === "string" ? mapsLink.trim() : "",
            latitude: Number.isFinite(Number(latitude)) && latitude !== null && latitude !== "" ? Number(latitude) : null,
            longitude: Number.isFinite(Number(longitude)) && longitude !== null && longitude !== "" ? Number(longitude) : null,
            status: "Available"
        });

        res.status(201).json({
            success: true,
            message: "Donation saved to MongoDB!",
            donation
        });
    } catch (error) {
        console.error("Save error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to save donation."
        });
    }
});


// ========================================
// ADMIN APIs - ADMIN ACCESS ONLY
// ========================================

// 1. Get dashboard statistics
app.get(
    "/api/admin/stats",
    authenticateToken,
    allowRoles("admin"),
    async function (req, res) {
        try {
            const [
                totalUsers,
                totalDonors,
                totalNGOs,
                totalVolunteers,
                totalDonations,
                availableDonations,
                reservedDonations,
                collectedDonations,
                deliveredDonations
            ] = await Promise.all([
                User.countDocuments(),
                User.countDocuments({ role: "donor" }),
                User.countDocuments({ role: "ngo" }),
                User.countDocuments({ role: "volunteer" }),
                Donation.countDocuments(),
                Donation.countDocuments({ status: "Available" }),
                Donation.countDocuments({ status: "Reserved" }),
                Donation.countDocuments({ status: "Collected" }),
                Donation.countDocuments({ status: "Delivered" })
            ]);

            res.json({
                success: true,
                stats: {
                    totalUsers,
                    totalDonors,
                    totalNGOs,
                    totalVolunteers,
                    totalDonations,
                    availableDonations,
                    reservedDonations,
                    collectedDonations,
                    deliveredDonations
                }
            });
        } catch (error) {
            console.error("Admin statistics error:", error.message);

            res.status(500).json({
                success: false,
                message: "Unable to retrieve dashboard statistics."
            });
        }
    }
);


// 2. Get all registered users
app.get(
    "/api/admin/users",
    authenticateToken,
    allowRoles("admin"),
    async function (req, res) {
        try {
            const users = await User.find()
                .select("-password")
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                count: users.length,
                users
            });
        } catch (error) {
            console.error("Admin users error:", error.message);

            res.status(500).json({
                success: false,
                message: "Unable to retrieve users."
            });
        }
    }
);


// 3. Activate or deactivate a user account
app.patch(
    "/api/admin/users/:id/status",
    authenticateToken,
    allowRoles("admin"),
    async function (req, res) {
        try {
            const { id } = req.params;
            const { isActive } = req.body;

            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user ID."
                });
            }

            if (typeof isActive !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message: "isActive must be true or false."
                });
            }

            if (id === req.user.id && isActive === false) {
                return res.status(400).json({
                    success: false,
                    message: "You cannot deactivate your own admin account."
                });
            }

            const user = await User.findByIdAndUpdate(
                id,
                { $set: { isActive } },
                { new: true, runValidators: true }
            ).select("-password");

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }

            res.json({
                success: true,
                message: isActive
                    ? "User account activated successfully."
                    : "User account deactivated successfully.",
                user
            });
        } catch (error) {
            console.error("Admin user update error:", error.message);

            res.status(500).json({
                success: false,
                message: "Unable to update user account."
            });
        }
    }
);


// 4. Get all donations for admin monitoring
app.get(
    "/api/admin/donations",
    authenticateToken,
    allowRoles("admin"),
    async function (req, res) {
        try {
            const donations = await Donation.find()
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                count: donations.length,
                donations
            });
        } catch (error) {
            console.error("Admin donations error:", error.message);

            res.status(500).json({
                success: false,
                message: "Unable to retrieve donations."
            });
        }
    }
);


// Connect to MongoDB, then start the server
async function startServer() {
    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI is missing. Check your .env file.");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB Atlas successfully!");

        app.listen(PORT, function () {
            console.log(`FoodBridge server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}


// DELETE a donation securely
app.delete(
    "/api/donations/:id",
    authenticateToken,
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid donation ID."
                });
            }

            const donation = await Donation.findById(id);

            if (!donation) {
                return res.status(404).json({
                    success: false,
                    message: "Donation not found."
                });
            }

            // Only the original donor or an admin can delete.
            const isAdmin = req.user.role === "admin";

            const isOwner =
                req.user.role === "donor" &&
                donation.donorId &&
                donation.donorId.toString() === req.user.id;

            if (!isAdmin && !isOwner) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to delete this donation."
                });
            }

            // Preserve the existing rule.
            if (donation.status !== "Available") {
                return res.status(400).json({
                    success: false,
                    message: "Only available donations can be removed."
                });
            }

            await Donation.findByIdAndDelete(id);

            res.json({
                success: true,
                message: "Donation removed successfully."
            });

        } catch (error) {
            console.error("Delete donation error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to remove donation."
            });
        }
    }
);

startServer();
