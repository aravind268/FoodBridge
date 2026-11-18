
function openPortal(role) {
    alert("Welcome to the " + role + " portal!");
}

const STORAGE_KEY = "foodBridgeDonations";

// ================================================
// COMMON FUNCTIONS
// ================================================

function getDonations() {
    try {
        const data = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Unable to load donations:", error);
        return [];
    }
}

async function getDonationsFromServer() {
    try {
        const response = await fetch(
            "http://localhost:5000/api/donations"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error("Unable to load donations from server.");
        }

        return result.donations;
    } catch (error) {
        console.error("Unable to fetch donations:", error);
        alert("Unable to load donations from the server.");
        return [];
    }
}

function saveDonations(donations) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(donations)
        );
        return true;
    } catch (error) {
        alert("Unable to save donations in this browser.");
        return false;
    }
}

function createParagraph(text) {
    const p = document.createElement("p");
    p.textContent = text;
    return p;
}

function createPhoneLink(label, phone) {
    const p = document.createElement("p");
    p.append(document.createTextNode(label + ": "));

    if (!phone) {
        p.append(document.createTextNode("Not provided"));
        return p;
    }

    const link = document.createElement("a");
    link.href = "tel:" + phone.replace(/[^\d+]/g, "");
    link.textContent = phone;

    p.appendChild(link);
    return p;
}


async function getCoordinates(address) {
    try {
        const url =
            "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
            encodeURIComponent(address);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Geocoding request failed.");
        }

        const results = await response.json();

        if (results.length === 0) {
            return null;
        }

        return {
            latitude: Number(results[0].lat),
            longitude: Number(results[0].lon)
        };
    } catch (error) {
        console.error("Unable to find address coordinates:", error);
        return null;
    }
}


function isExpired(donation) {
    const deadline = new Date(donation.pickupDeadline);

    return (
        !donation.pickupDeadline ||
        isNaN(deadline.getTime()) ||
        deadline <= new Date()
    );
}

function isDonationAvailable(donation) {
    return (
        (donation.status || "Available") === "Available" &&
        !isExpired(donation)
    );
}



function getDisplayStatus(donation) {
    if (donation.status === "Delivered") {
        return "Delivered";
    }

    if (donation.status === "Collected") {
        return "Collected";
    }

    if (donation.status === "Reserved") {
        return "Reserved";
    }

    return isExpired(donation) ? "Expired" : "Available";
}


// ================================================
// DONATE FOOD PAGE
// ================================================

const donationForm = document.getElementById("donationForm");

if (donationForm) {
donationForm.addEventListener("submit", async function (event) {        event.preventDefault();

        const foodName =
            document.getElementById("foodName").value.trim();
        
        
const restaurantName =
    document.getElementById("restaurantName").value.trim();

const pickupAddress =
    document.getElementById("pickupAddress").value.trim();

const contactPhone =
    document.getElementById("contactPhone").value.trim();

const mapsLink =
    document.getElementById("mapsLink").value.trim();


        const quantity =
            Number(document.getElementById("quantity").value);

        const description =
            document.getElementById("description").value.trim();

        const foodImage =
            document.getElementById("foodImage").value.trim();

        const preparedValue =
            document.getElementById("preparedAt").value;

        const deadlineValue =
            document.getElementById("pickupDeadline").value;

        const storage =
            document.getElementById("storage").value;

        if (!foodName) {
            alert("Please enter the food name.");
            return;
        }

        if (
            !Number.isFinite(quantity) ||
            quantity < 0.1 ||
            quantity > 500
        ) {
            alert("Quantity must be between 0.1 and 500 kg.");
            return;
        }

        if (
            description.length < 10 ||
            description.length > 200
        ) {
            alert("Description must contain 10–200 characters.");
            return;
        }

        if (foodImage && !/^https?:\/\/\S+$/i.test(foodImage)) {
            alert(
                "Please enter a valid image URL starting with http:// or https://."
            );
            return;
        }

        if (!preparedValue || !deadlineValue) {
            alert("Please enter both preparation and pickup times.");
            return;
        }

        const preparedAt = new Date(preparedValue);
        const deadline = new Date(deadlineValue);
        const now = new Date();

        if (
            isNaN(preparedAt.getTime()) ||
            isNaN(deadline.getTime())
        ) {
            alert("Please enter valid dates and times.");
            return;
        }

        if (preparedAt > now) {
            alert("Preparation time cannot be in the future.");
            return;
        }

        if (deadline <= preparedAt || deadline <= now) {
            alert(
                "Pickup deadline must be after preparation time and in the future."
            );
            return;
        }

        if (
            !["hot", "refrigerated", "room-temperature"].includes(storage)
        ) {
            alert("Please select a valid storage method.");
            return;
        }

        const donations = getDonations();
        const coordinates = await getCoordinates(pickupAddress);
        if (!coordinates) {
    alert(
        "We couldn't locate this pickup address. " +
        "Please check the address. The donation will still be saved, " +
        "but it may not appear correctly in nearby sorting."
    );
}

   

donations.push({
    id: Date.now().toString(),
    status: "Available",
    foodName,
    quantity,
    description,
    foodImage,
    preparedAt: preparedValue,
    pickupDeadline: deadlineValue,
    storage,
    restaurantName,
    pickupAddress,
    contactPhone,
    mapsLink,
    latitude: coordinates ? coordinates.latitude : null,
longitude: coordinates ? coordinates.longitude : null
});


       
const donation = {
    foodName,
    quantity,
    description,
    foodImage,
    preparedAt: preparedValue,
    pickupDeadline: deadlineValue,
    storage,
    restaurantName,
    pickupAddress,
    contactPhone,
    mapsLink,
    latitude: coordinates ? coordinates.latitude : null,
    longitude: coordinates ? coordinates.longitude : null
};

try {
    const response = await fetch("http://localhost:5000/api/donations", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(donation)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        alert(result.message || "Unable to save donation.");
        return;
    }

    alert("Food donation saved successfully to MongoDB!");
    donationForm.reset();
} catch (error) {
    console.error("Donation save error:", error);
    alert("Cannot connect to the server. Please make sure the backend is running.");
}

    });
}

// ================================================
// MY DONATIONS PAGE AND FILTERS
// ================================================

const donationsList = document.getElementById("donationsList");
const donationCount = document.getElementById("donationCount");
const availableCount = document.getElementById("availableCount");
const reservedCount = document.getElementById("reservedCount");
const totalQuantity = document.getElementById("totalQuantity");

if (donationsList) {
    let currentFilter = "All";

    const filterButtons =
        document.querySelectorAll(".donation-filter");

    async function renderDonations() {
        const donations = await getDonationsFromServer();
        const now = new Date();

        // Update counters.

        if (donationCount) {
            donationCount.textContent =
                "Total Donations: " + donations.length;
        }

        if (availableCount) {
            availableCount.textContent =
                "Available Donations: " +
                donations.filter(isDonationAvailable).length;
        }

        if (reservedCount) {
            reservedCount.textContent =
                "Reserved Donations: " +
                donations.filter(function (donation) {
                    return donation.status === "Reserved";
                }).length;
        }

        if (totalQuantity) {
            const total = donations.reduce(function (sum, donation) {
                const quantity = Number(donation.quantity);

                return sum + (
                    Number.isFinite(quantity) && quantity > 0
                        ? quantity
                        : 0
                );
            }, 0);

            totalQuantity.textContent =
                "Total Food Donated: " + total.toFixed(1) + " kg";
        }

        // Filter donations.

        const filteredDonations = donations.filter(function (donation) {
            const status = getDisplayStatus(donation);

            if (currentFilter === "All") {
                return true;
            }

            if (currentFilter === "Available") {
                return status === "Available";
            }

            if (currentFilter === "Reserved") {
                return status === "Reserved";
            }

            if (currentFilter === "Expired") {
                return status === "Expired";
            }

            return true;
        });

        donationsList.replaceChildren();

        if (filteredDonations.length === 0) {
            donationsList.appendChild(
                createParagraph("No donations found for this filter.")
            );
            return;
        }

        filteredDonations.forEach(function (donation) {
            const card = document.createElement("div");
            card.className = "portal-card";

            const title = document.createElement("h3");
            title.textContent = donation.foodName || "Unnamed food";

 const idText = createParagraph(
    "Donation ID: " + (donation._id || donation.id || "Unavailable")
);

            const status = getDisplayStatus(donation);
            const statusText = createParagraph("Status: " + status);

            statusText.style.display = "inline-block";
            statusText.style.padding = "6px 12px";
            statusText.style.borderRadius = "20px";
            statusText.style.fontWeight = "bold";

            if (status === "Available") {
                statusText.style.backgroundColor = "#e0f5e5";
                statusText.style.color = "#187a36";
            } else if (status === "Reserved") {
                statusText.style.backgroundColor = "#fff0c2";
                statusText.style.color = "#92400e";
            } else {
                statusText.style.backgroundColor = "#fee2e2";
                statusText.style.color = "#b91c1c";
            }

            const quantityText = createParagraph(
                "Quantity: " + donation.quantity + " kg"
            );

            const descriptionText = createParagraph(
                "Description: " +
                (donation.description || "No description")
            );

            const preparedText = createParagraph(
                "Prepared at: " +
                String(donation.preparedAt || "").replace("T", " ")
            );

            const storageText = createParagraph(
                "Storage: " + (donation.storage || "Not specified")
            );

            if (donation.storage === "hot") {
                storageText.style.color = "#b45309";
            } else if (donation.storage === "refrigerated") {
                storageText.style.color = "#2563eb";
            } else if (donation.storage === "room-temperature") {
                storageText.style.color = "#15803d";
            }

            storageText.style.fontWeight = "bold";

            const deadlineText = createParagraph(
                "Pickup deadline: " +
                String(donation.pickupDeadline || "").replace("T", " ")
            );

            card.append(
                title,
                idText,
                statusText,
                quantityText,
                descriptionText,
                preparedText,
                storageText,
                deadlineText
            );

            // NEW: Display the NGO name for reserved donations.


if (donation.status === "Reserved" && donation.reservedBy) {
    card.appendChild(
        createParagraph("Reserved by: " + donation.reservedBy)
    );

    if (donation.reservedAt) {
        const reservedDate = new Date(donation.reservedAt);

        card.appendChild(
            createParagraph(
                "Reserved on: " +
                reservedDate.toLocaleString()
            )
        );
    }
}


if (donation.status === "Collected" || donation.status === "Delivered") {
    card.appendChild(
        createParagraph(
            "Collected by volunteer: " +
            (donation.volunteerName || "Not recorded")
        )
    );

    if (donation.collectedAt) {
        card.appendChild(
            createParagraph(
                "Collected on: " +
                new Date(donation.collectedAt).toLocaleString()
            )
        );
    }
}

if (donation.status === "Delivered") {
    card.appendChild(
        createParagraph(
            "Delivery status: " +
            (donation.ngoConfirmedAt
                ? "Delivered — NGO confirmed receipt"
                : "Delivered — NGO confirmation pending")
        )
    );

    card.appendChild(
        createParagraph(
            "Delivery marked by: " +
            (donation.deliveredBy || "Not recorded")
        )
    );

    if (donation.deliveredAt) {
        card.appendChild(
            createParagraph(
                "Delivered on: " +
                new Date(donation.deliveredAt).toLocaleString()
            )
        );
    }

    if (donation.ngoConfirmedAt) {
        card.appendChild(
            createParagraph(
                "NGO confirmed on: " +
                new Date(donation.ngoConfirmedAt).toLocaleString()
            )
        );
    }
}


            // Display food image.

            if (donation.foodImage) {
                const image = document.createElement("img");

                image.src = donation.foodImage;
                image.alt = donation.foodName || "Donated food";
                image.style.width = "100%";
                image.style.maxWidth = "300px";
                image.style.borderRadius = "10px";
                image.style.marginBottom = "10px";

                image.onerror = function () {
                    this.style.display = "none";
                };

                card.appendChild(image);
            }

            // Display pickup-time message.

            const timeText = document.createElement("p");
            const deadline = new Date(donation.pickupDeadline);

            if (
                !donation.pickupDeadline ||
                isNaN(deadline.getTime())
            ) {
                timeText.textContent = "Pickup time unavailable";
            } else if (deadline <= now) {
                timeText.textContent = "Pickup deadline has passed";
                timeText.style.color = "#b91c1c";
                timeText.style.fontWeight = "bold";
            } else {
                const minutes = Math.ceil(
                    (deadline - now) / (1000 * 60)
                );

                if (minutes < 60) {
                    timeText.textContent =
                        "Time until pickup: " + minutes + " minutes";
                } else {
                    timeText.textContent =
                        "Time until pickup: " +
                        Math.floor(minutes / 60) + " hours " +
                        (minutes % 60) + " minutes";
                }
            }

            card.appendChild(timeText);

            // Delete an individual donation.

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "Delete Donation";

            deleteButton.addEventListener("click", function () {
                if (
                    !confirm(
                        "Delete the donation: " + donation.foodName + "?"
                    )
                ) {
                    return;
                }

                const updated = getDonations().filter(function (item) {
                    return item.id !== donation.id;
                });

                if (saveDonations(updated)) {
                    renderDonations();
                }
            });

            card.appendChild(deleteButton);
            donationsList.appendChild(card);
        });
    }

    // Connect donation filters.

    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            currentFilter = button.dataset.filter;

            filterButtons.forEach(function (item) {
                item.style.fontWeight =
                    item === button ? "bold" : "normal";
            });

            renderDonations();
        });
    });

    renderDonations().catch(console.error);
}

// ================================================
// CLEAR ALL TEST DONATIONS
// ================================================

const clearDonationsButton =
    document.getElementById("clearDonationsButton");

if (clearDonationsButton) {
    clearDonationsButton.addEventListener("click", function () {
        if (!confirm("Delete all saved donations from this browser?")) {
            return;
        }

        localStorage.removeItem(STORAGE_KEY);
        alert("All saved donations have been cleared.");
        window.location.reload();
    });
}

// ================================================
// NGO PORTAL: SEARCH, SORT AND RESERVE FOOD
// ================================================

const ngoDonationsList =
    document.getElementById("ngoDonationsList");

const ngoNameInput =
    document.getElementById("ngoName");

    
const ngoPhoneInput =
    document.getElementById("ngoPhone");

const ngoAddressInput =
    document.getElementById("ngoAddress");


const ngoSearch =
    document.getElementById("ngoSearch");

const ngoSort =
    document.getElementById("ngoSort");
const findNearbyButton = document.getElementById("findNearbyButton");
const nearbyStatus = document.getElementById("nearbyStatus");
    
let userLatitude = null;
let userLongitude = null;

function getDistanceKm(lat1, lon1, lat2, lon2) {
    const toRadians = function(value) {
        return value * Math.PI / 180;
    };

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    return 6371 * 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );
}


let ngoSortBy = "deadline";
let ngoSearchTerm = "";

if (ngoDonationsList) {

    async function renderNGODonations() {
        ngoDonationsList.replaceChildren();

        // Find available donations matching the search.

        const allServerDonations = await getDonationsFromServer();

let availableDonations = allServerDonations.filter(
            function (donation) {
                

const currentNGO = ngoNameInput
    ? ngoNameInput.value.trim()
    : "";

const matchesAvailability =
    isDonationAvailable(donation) ||
    (
        donation.reservedBy === currentNGO &&
        ["Reserved", "Collected", "Delivered"].includes(donation.status)
    );



                const matchesSearch =
                    (donation.foodName || "")
                        .toLowerCase()
                        .includes(ngoSearchTerm);

                return matchesAvailability && matchesSearch;
            }
        );

        // Sort the donations.


availableDonations.sort(function (a, b) {
    if (ngoSortBy === "name") {
        return (a.foodName || "").localeCompare(
            b.foodName || ""
        );
    }

    if (ngoSortBy === "quantity") {
        return Number(b.quantity || 0) -
            Number(a.quantity || 0);
    }

    if (ngoSortBy === "distance") {
        const hasCoordinates = function (d) {
            return (
                d.latitude !== null &&
                d.latitude !== undefined &&
                d.latitude !== "" &&
                d.longitude !== null &&
                d.longitude !== undefined &&
                d.longitude !== "" &&
                Number.isFinite(Number(d.latitude)) &&
                Number.isFinite(Number(d.longitude))
            );
        };

        const aHasLocation = hasCoordinates(a);
        const bHasLocation = hasCoordinates(b);

        if (aHasLocation && !bHasLocation) return -1;
        if (!aHasLocation && bHasLocation) return 1;

        if (aHasLocation && bHasLocation) {
            const distanceA = getDistanceKm(
                userLatitude,
                userLongitude,
                Number(a.latitude),
                Number(a.longitude)
            );

            const distanceB = getDistanceKm(
                userLatitude,
                userLongitude,
                Number(b.latitude),
                Number(b.longitude)
            );

            return distanceA - distanceB;
        }

        return 0;
    }

    return new Date(a.pickupDeadline) -
        new Date(b.pickupDeadline);
});


        if (availableDonations.length === 0) {
            ngoDonationsList.textContent =
                "No available food donations right now.";
            return;
        }

        availableDonations.forEach(function (donation) {
            const card = document.createElement("div");
            card.className = "portal-card";

            const title = document.createElement("h3");
            title.textContent = donation.foodName || "Unnamed food";

            card.append(
                title,
                createParagraph("Quantity: " + donation.quantity + " kg"),
                createParagraph(
                    "Description: " +
                    (donation.description || "No description")
                ),
                createParagraph(
                    "Storage: " + (donation.storage || "Not specified")
                ),
                createParagraph(
                    "Pickup deadline: " +
                    String(donation.pickupDeadline || "").replace("T", " ")
                )
            );

            if (donation.foodImage) {
                const image = document.createElement("img");

                image.src = donation.foodImage;
                image.alt = donation.foodName || "Donated food";
                image.style.width = "100%";
                image.style.maxWidth = "300px";
                image.style.borderRadius = "10px";

                image.onerror = function () {
                    this.style.display = "none";
                };

                card.appendChild(image);
            }

            const reserveButton = document.createElement("button");
            reserveButton.type = "button";
            reserveButton.textContent = "Reserve Food";

           
reserveButton.addEventListener("click", async function () {    const ngoName = ngoNameInput
        ? ngoNameInput.value.trim()
        : "";

    const ngoPhone = ngoPhoneInput
        ? ngoPhoneInput.value.trim()
        : "";

    const ngoAddress = ngoAddressInput
        ? ngoAddressInput.value.trim()
        : "";

    if (!ngoName) {
        alert("Please enter your NGO name.");
        if (ngoNameInput) ngoNameInput.focus();
        return;
    }

    if (!/^[6-9][0-9]{9}$/.test(ngoPhone)) {
        alert("Please enter a valid 10-digit Indian NGO phone number.");
        if (ngoPhoneInput) ngoPhoneInput.focus();
        return;
    }

    if (!ngoAddress) {
        alert("Please enter your NGO delivery address.");
        if (ngoAddressInput) ngoAddressInput.focus();
        return;
    }

    if (!confirm("Reserve " + donation.foodName + "?")) {
        return;
    }


    try {
        const response = await fetch(
            "http://localhost:5000/api/donations/" +
            donation._id +
            "/reserve",
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ngoName: ngoName,
                    ngoPhone: ngoPhone,
                    deliveryAddress: ngoAddress
                })
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.message || "Unable to reserve this donation.");
            await renderNGODonations();
            return;
        }

        alert("Food reserved successfully!");
        await renderNGODonations();

    } catch (error) {
        console.error("Reservation error:", error);
        alert("Unable to contact the server. Please try again.");
    }

});


            
if (isDonationAvailable(donation)) {
    card.appendChild(reserveButton);
}

// Show delivery details and allow the reserving NGO to confirm receipt.
if (
    donation.status === "Delivered" &&
    !donation.ngoConfirmedAt &&
    donation.reservedBy === (
        ngoNameInput ? ngoNameInput.value.trim() : ""
    )
) {
    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.textContent = "Confirm Receipt";

    
confirmButton.addEventListener("click", async function () {
    if (!confirm("Have you received this food donation?")) {
        return;
    }

    const ngoName = ngoNameInput
        ? ngoNameInput.value.trim()
        : "";

    if (!ngoName) {
        alert("Please enter your NGO name.");
        if (ngoNameInput) ngoNameInput.focus();
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:5000/api/donations/" +
            donation._id +
            "/confirm-receipt",
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ngoName: ngoName
                })
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Unable to confirm receipt."
            );
        }

        alert("Receipt confirmed successfully!");
        await renderNGODonations();
    } catch (error) {
        console.error("Receipt confirmation error:", error);
        alert(error.message || "Unable to confirm receipt.");
    }
});

    card.appendChild(confirmButton);
}




// Show restaurant and pickup address.
card.appendChild(
    createParagraph(
        "Restaurant: " + (donation.restaurantName || "Not provided")
    )
);

card.appendChild(
    createParagraph(
        "Pickup Address: " + (donation.pickupAddress || "Not provided")
    )
);

 // Show volunteer contact details after collection
if (
    ["Collected", "Delivered"].includes(donation.status)
) {
    card.appendChild(
        createParagraph(
            "Volunteer Name: " + (donation.volunteerName || "Not provided")
        )
    );

    card.appendChild(
        createParagraph(
            "Volunteer Phone: " + (donation.volunteerPhone || "Not provided")
        )
    );

    if (donation.volunteerPhone) {
        const volunteerCallLink = document.createElement("a");

        volunteerCallLink.href = "tel:" + donation.volunteerPhone;
        volunteerCallLink.textContent =
            "Call Volunteer: " + donation.volunteerPhone;

        volunteerCallLink.style.display = "block";
        volunteerCallLink.style.margin = "10px 0";

        card.appendChild(volunteerCallLink);
    }
}


// Allow NGO to call the donor.
if (donation.contactPhone) {
    const callLink = document.createElement("a");
    callLink.href = "tel:" + donation.contactPhone;
    callLink.textContent = "Call Donor: " + donation.contactPhone;
    callLink.style.display = "block";
    callLink.style.margin = "10px 0";
    card.appendChild(callLink);
}

// Open the pickup location in Google Maps.
const mapURL = donation.mapsLink
    ? donation.mapsLink
    : donation.pickupAddress
        ? "https://www.google.com/maps/search/?api=1&query=" +
          encodeURIComponent(donation.pickupAddress)
        : "";

if (mapURL) {
    const mapLink = document.createElement("a");
    mapLink.href = mapURL;
    mapLink.target = "_blank";
    mapLink.rel = "noopener noreferrer";
    mapLink.textContent = "Open in Google Maps";
    mapLink.style.display = "block";
    mapLink.style.margin = "10px 0";
    card.appendChild(mapLink);
}

ngoDonationsList.appendChild(card);

        });
    }

    // Attach search listener inside the correct scope.

    if (ngoSearch) {
        ngoSearch.addEventListener("input", function () {
            ngoSearchTerm = ngoSearch.value.trim().toLowerCase();
            renderNGODonations();
        });
    }

    // Attach exactly one sorting listener.

if (ngoSort) {
    ngoSort.addEventListener("change", function () {
        ngoSortBy = ngoSort.value;
        renderNGODonations();
    });
}

if (ngoNameInput) {
    ngoNameInput.addEventListener("input", function () {
        renderNGODonations();
    });
}

renderNGODonations();

    renderNGODonations();
    
if (findNearbyButton) {
    findNearbyButton.addEventListener("click", function() {
        if (!navigator.geolocation) {
            nearbyStatus.textContent =
                "Your browser does not support location access.";
            return;
        }

        nearbyStatus.textContent = "Finding your location...";

        navigator.geolocation.getCurrentPosition(
            function(position) {
                userLatitude = position.coords.latitude;
                userLongitude = position.coords.longitude;

                ngoSortBy = "distance";

                if (ngoSort) {
                    ngoSort.value = "distance";
                }

                nearbyStatus.textContent =
                    "Location found! Sorting donations by distance.";

                renderNGODonations();
            },
            function() {
                nearbyStatus.textContent =
                    "Location access failed. Please allow location permission.";
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    });
}

}


/* ================================================
   ADMIN PORTAL: DASHBOARD AND DONATION MANAGEMENT
================================================ */

const adminDonationsList = document.getElementById("adminDonationsList");

if (adminDonationsList) {
    const adminTotal = document.getElementById("adminTotal");
    const adminAvailable = document.getElementById("adminAvailable");
    const adminReserved = document.getElementById("adminReserved");
    const adminCollected = document.getElementById("adminCollected");
    const adminDelivered = document.getElementById("adminDelivered");
    const adminExpired = document.getElementById("adminExpired");
    const adminSearch = document.getElementById("adminSearch");
    const adminStatusFilter = document.getElementById("adminStatusFilter");
    const adminRefresh = document.getElementById("adminRefresh");
    const adminMessage = document.getElementById("adminMessage");

   async function renderAdminDashboard() {
    const donations = await getDonationsFromServer();
        const searchTerm = adminSearch.value.trim().toLowerCase();
        const selectedStatus = adminStatusFilter.value;

        const statuses = donations.map(function (donation) {
            return getDisplayStatus(donation);
        });

        adminTotal.textContent = donations.length;
        adminAvailable.textContent =
            statuses.filter(status => status === "Available").length;
        adminReserved.textContent =
            statuses.filter(status => status === "Reserved").length;
        adminCollected.textContent =
            statuses.filter(status => status === "Collected").length;
        adminDelivered.textContent =
            statuses.filter(status => status === "Delivered").length;
        adminExpired.textContent =
            statuses.filter(status => status === "Expired").length;

        const filteredDonations = donations.filter(function (donation) {
            const status = getDisplayStatus(donation);
            const matchesStatus =
                selectedStatus === "all" || status === selectedStatus;

            const searchableText = [
                donation.foodName,
                donation.restaurantName,
                donation.reservedBy,
                donation.volunteerName
            ].join(" ").toLowerCase();

            return matchesStatus && searchableText.includes(searchTerm);
        });

        adminDonationsList.replaceChildren();

        if (filteredDonations.length === 0) {
            adminDonationsList.textContent = "No matching donations found.";
            return;
        }

        filteredDonations.forEach(function (donation) {
            const card = document.createElement("div");
            card.className = "portal-card";

const progressTitle = document.createElement("h3");
progressTitle.textContent = "Donation Progress";
card.appendChild(progressTitle);

const progressSteps = [
    {
        label: "Reserved",
        completed: Boolean(donation.reservedAt)
    },
    {
        label: "Collected",
        completed: Boolean(donation.collectedAt)
    },
    {
        label: "Delivered",
        completed: Boolean(donation.deliveredAt)
    },
    {
        label: "NGO Receipt Confirmed",
        completed: Boolean(donation.ngoConfirmedAt)
    }
];

progressSteps.forEach(function (step) {
    const progressItem = document.createElement("p");
    progressItem.textContent =
        (step.completed ? "✅ " : "○ ") + step.label;

    card.appendChild(progressItem);
});

            
card.append(
    createParagraph("Food: " + (donation.foodName || "Unnamed")),
    createParagraph("Donation ID: " + (donation._id || donation.id || "Unavailable")),
    createParagraph("Restaurant: " + (donation.restaurantName || "Not provided")),
    createParagraph("Quantity: " + (donation.quantity || 0) + " kg"),
    createParagraph("Description: " + (donation.description || "Not provided")),
    createParagraph("Status: " + getDisplayStatus(donation)),
    createParagraph("Prepared at: " + (donation.preparedAt || "Not provided")),
    createParagraph("Pickup deadline: " + (donation.pickupDeadline || "Not provided")),
    createParagraph("Storage: " + (donation.storage || "Not provided")),

createPhoneLink("Donor phone", donation.contactPhone),
createPhoneLink("NGO phone", donation.ngoPhone),
createPhoneLink("Volunteer phone", donation.volunteerPhone),

    createParagraph("Volunteer: " + (donation.volunteerName || "Not assigned")),
    createParagraph("Volunteer phone: " + (donation.volunteerPhone || "Not provided")),
    createParagraph("Pickup address: " + (donation.pickupAddress || "Not provided")),
    createParagraph("Delivery address: " + (donation.deliveryAddress || "Not provided"))
);


            if (donation.ngoConfirmedAt) {
                card.appendChild(
                    createParagraph(
                        "NGO receipt confirmed: " +
                        new Date(donation.ngoConfirmedAt).toLocaleString()
                    )
                );
            }
            if (donation.reservedAt) {
    card.appendChild(
        createParagraph(
            "Reserved at: " +
            new Date(donation.reservedAt).toLocaleString()
        )
    );
}

if (donation.collectedAt) {
    card.appendChild(
        createParagraph(
            "Collected at: " +
            new Date(donation.collectedAt).toLocaleString()
        )
    );
}

if (donation.deliveredAt) {
    card.appendChild(
        createParagraph(
            "Delivered at: " +
            new Date(donation.deliveredAt).toLocaleString()
        )
    );
}
if (donation.reservedAt) {
    card.appendChild(
        createParagraph(
            "Reserved at: " +
            new Date(donation.reservedAt).toLocaleString()
        )
    );
}

if (donation.collectedAt) {
    card.appendChild(
        createParagraph(
            "Collected at: " +
            new Date(donation.collectedAt).toLocaleString()
        )
    );
}

if (donation.deliveredAt) {
    card.appendChild(
        createParagraph(
            "Delivered at: " +
            new Date(donation.deliveredAt).toLocaleString()
        )
    );
}
            
            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.textContent = "Remove Donation";

           
removeButton.addEventListener("click", async function () {
    const confirmed = confirm(
        "Are you sure you want to remove this donation?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:5000/api/donations/" +
            (donation._id || donation.id),
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Unable to remove donation."
            );
        }

        adminMessage.textContent = "Donation removed successfully.";

        await renderAdminDashboard();
    } catch (error) {
        console.error("Remove donation error:", error);
        adminMessage.textContent =
            error.message || "Unable to remove donation.";
    }
});


            card.appendChild(removeButton);

            adminDonationsList.appendChild(card);
        });

        adminMessage.textContent =
            "Showing " + filteredDonations.length + " of " +
            donations.length + " donations.";
    }

    adminSearch.addEventListener("input", renderAdminDashboard);
    adminStatusFilter.addEventListener("change", renderAdminDashboard);
    adminRefresh.addEventListener("click", renderAdminDashboard);

    renderAdminDashboard();
}

/* =================================
   ADMIN: EXPORT DONATIONS TO CSV
================================= */

const adminExport = document.getElementById("adminExport");

if (adminExport) {
   adminExport.addEventListener("click", async function () {
        const searchTerm = adminSearch.value.trim().toLowerCase();
const selectedStatus = adminStatusFilter.value;

const allDonations = await getDonationsFromServer();

const donations = allDonations.filter(function (donation) {
    const status = getDisplayStatus(donation);
    const matchesStatus =
        selectedStatus === "all" || status === selectedStatus;

    const searchableText = [
        donation.foodName,
        donation.restaurantName,
        donation.reservedBy,
        donation.volunteerName
    ].join(" ").toLowerCase();

    return matchesStatus && searchableText.includes(searchTerm);
});

        if (donations.length === 0) {
            alert("There are no donations to export.");
            return;
        }

        const columns = [
            "id",
            "foodName",
            "restaurantName",
            "quantity",
            "description",
            "status",
            "preparedAt",
            "pickupDeadline",
            "storage",
            "contactPhone",
            "pickupAddress",
            "reservedBy",
            "ngoPhone",
            "volunteerName",
            "volunteerPhone",
            "deliveryAddress",
            "reservedAt",
            "collectedAt",
            "deliveredAt",
            "ngoConfirmedAt"
        ];

        function escapeCSV(value) {
            let text = value == null ? "" : String(value);

            // Prevent spreadsheet formula execution from exported text.
            if (/^[\t\r ]*[=+\-@]/.test(text)) {
                text = "'" + text;
            }

            return '"' + text.replace(/"/g, '""') + '"';
        }

        const rows = [
            columns.join(","),
            ...donations.map(function (donation) {
                return columns.map(function (column) {
                    return escapeCSV(
                        column === "status"
                            ? getDisplayStatus(donation)
                            : donation[column]
                    );
                }).join(",");
            })
        ];

        const csv = "\uFEFF" + rows.join("\r\n");
        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "FoodBridge_Donations.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    });
}

/* ================================
   VOLUNTEER PORTAL - MONGODB
================================ */

const volunteerAssignments = document.getElementById("volunteerAssignments");
const volunteerStatus = document.getElementById("volunteerStatus");
const volunteerNameInput = document.getElementById("volunteerName");
const volunteerPhoneInput = document.getElementById("volunteerPhone");

async function renderVolunteerAssignments() {
    if (!volunteerAssignments) return;

    volunteerAssignments.replaceChildren();
    volunteerStatus.textContent = "Loading assignments...";

    try {
        const response = await fetch("http://localhost:5000/api/donations");
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error("Could not load donations.");
        }

        const pendingDonations = result.donations.filter(donation =>
            ["Reserved", "Collected"].includes(donation.status)
        );

        if (pendingDonations.length === 0) {
            volunteerStatus.textContent =
                "No food pickup assignments available yet.";
            return;
        }

        volunteerStatus.textContent =
            `${pendingDonations.length} food pickup assignment(s) available.`;

        pendingDonations.forEach(donation => {
            const card = document.createElement("div");
            card.className = "portal-card";

            const addText = (label, value) => {
                const p = document.createElement("p");
                p.textContent = `${label}: ${value || "Not provided"}`;
                card.appendChild(p);
            };

            const title = document.createElement("h3");
            title.textContent = donation.foodName || "Food Donation";
            card.appendChild(title);

            addText("Quantity", `${donation.quantity} kg`);
            addText("Status", donation.status);
            addText("Restaurant", donation.restaurantName);
            addText("Pickup address", donation.pickupAddress);
            addText("NGO name", donation.reservedBy);
            addText("NGO phone", donation.ngoPhone);
            addText("Delivery address", donation.deliveryAddress);

            const addMapLink = (label, address) => {
                if (!address) return;

                const link = document.createElement("a");
                link.href =
                    "https://www.google.com/maps/search/?api=1&query=" +
                    encodeURIComponent(address);
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = label;

                const p = document.createElement("p");
                p.appendChild(link);
                card.appendChild(p);
            };

            addMapLink("Navigate to Pickup", donation.pickupAddress);
            addMapLink("Navigate to Delivery", donation.deliveryAddress);

            if (donation.status === "Reserved") {
                const collectButton = document.createElement("button");
                collectButton.textContent = "Mark as Collected";

                collectButton.addEventListener("click", async () => {
                    const volunteer = volunteerNameInput.value.trim();
                    const phone = volunteerPhoneInput.value.trim();

                    if (!volunteer) {
                        alert("Please enter your volunteer name.");
                        volunteerNameInput.focus();
                        return;
                    }

                    if (!/^[6-9][0-9]{9}$/.test(phone)) {
                        alert("Please enter a valid 10-digit mobile number.");
                        volunteerPhoneInput.focus();
                        return;
                    }

                    if (!confirm("Have you collected this food donation?")) return;

                    try {
                        const collectResponse = await fetch(
                            `http://localhost:5000/api/donations/${donation._id}/collect`,
                            {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    volunteerName: volunteer,
                                    volunteerPhone: phone
                                })
                            }
                        );

                        const collectResult = await collectResponse.json();

                        if (!collectResponse.ok || !collectResult.success) {
                            throw new Error(
                                collectResult.message || "Collection update failed."
                            );
                        }

                        alert("Food marked as collected successfully!");
                        await renderVolunteerAssignments();
                    } catch (error) {
                        console.error(error);
                        alert(error.message || "Unable to update collection.");
                    }
                });

                card.appendChild(collectButton);
            }

            if (donation.status === "Collected") {
                const deliverButton = document.createElement("button");
                deliverButton.textContent = "Mark as Delivered";

                deliverButton.addEventListener("click", async () => {
                    const volunteer = volunteerNameInput.value.trim();

                    if (!volunteer) {
                        alert("Enter the same volunteer name used during collection.");
                        volunteerNameInput.focus();
                        return;
                    }

                    if (!confirm("Have you delivered this food to the NGO?")) return;

                    try {
                        const deliverResponse = await fetch(
                            `http://localhost:5000/api/donations/${donation._id}/deliver`,
                            {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ volunteerName: volunteer })
                            }
                        );

                        const deliverResult = await deliverResponse.json();

                        if (!deliverResponse.ok || !deliverResult.success) {
                            throw new Error(
                                deliverResult.message || "Delivery update failed."
                            );
                        }

                        alert("Delivery recorded! NGO confirmation is pending.");
                        await renderVolunteerAssignments();
                    } catch (error) {
                        console.error(error);
                        alert(error.message || "Unable to update delivery.");
                    }
                });

                card.appendChild(deliverButton);
            }

            volunteerAssignments.appendChild(card);
        });
    } catch (error) {
        console.error("Volunteer assignments error:", error);
        volunteerStatus.textContent =
            "Unable to load assignments. Check that the backend is running.";
    }
}

if (volunteerAssignments) {
    renderVolunteerAssignments();
}
