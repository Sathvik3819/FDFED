
document.addEventListener('DOMContentLoaded', function() {

  // Services tabs functionality
  const tabButtons = document.querySelectorAll('#services-tab button');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Community filter functionality
  const locationSelect = document.getElementById('location');
  const amenitiesSelect = document.getElementById('amenities');
  const priceSelect = document.getElementById('price');
  const searchButton = document.querySelector('#search button');
  
  searchButton.addEventListener('click', function() {
    const location = locationSelect.value;
    const amenities = amenitiesSelect.value;
    const price = priceSelect.value;
    
    // In a real application, this would filter communities or redirect to search results
    console.log('Searching for communities with:', { location, amenities, price });
    
    // For demo purposes, show an alert
    if (location !== 'Select Location') {
      alert(`Searching for communities in ${location}${amenities !== 'Amenities' ? ' with ' + amenities : ''}${price !== 'Price Range' ? ' in price range ' + price : ''}`);
    } else {
      alert('Please select a location to search');
    }
  });

  // Contact form submission
  const contactForm = document.querySelector('.contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const subject = document.getElementById('subject').value;
      const message = document.getElementById('message').value;
      
      // In a real application, this would send the form data to a server
      console.log('Form submitted:', { name, email, subject, message });
      
      // For demo purposes, show a success message
      alert('Thank you for your message! We will get back to you soon.');
      
      // Reset the form
      contactForm.reset();
    });
  }

  // Newsletter subscription
  const subscribeButtons = document.querySelectorAll('button[type="button"]:contains("Subscribe")');
  
  subscribeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const input = this.previousElementSibling;
      
      if (input && input.value) {
        // In a real application, this would subscribe the email to a newsletter
        console.log('Newsletter subscription:', input.value);
        
        // For demo purposes, show a success message
        alert(`Thank you for subscribing with ${input.value}!`);
        
        // Reset the input
        input.value = '';
      } else {
        alert('Please enter a valid email address');
      }
    });
  });

  

  // Initialize any Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});

// Fix for the :contains selector used above
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    var el = this;
    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

// Custom :contains selector implementation
NodeList.prototype.forEach = Array.prototype.forEach;
HTMLCollection.prototype.forEach = Array.prototype.forEach;

document.querySelectorAll = document.querySelectorAll || function(selector) {
  return Array.prototype.slice.call(document.querySelectorAll(selector));
};

// Polyfill for NodeList.forEach in older browsers
if (window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
}

function updateCarouselItems() {
  let screenWidth = window.innerWidth;
  let cardsPerSlide = screenWidth >= 768 ? 3 : screenWidth >= 576 ? 2 : 1; 

  document.querySelectorAll('.carousel-item').forEach((item, index) => {
    let start = index * cardsPerSlide;
    let end = start + cardsPerSlide;
    let communityCards = document.querySelectorAll('.community-card');

    // Hide all cards
    communityCards.forEach(card => card.style.display = "none");

    // Show only required number of cards per slide
    for (let i = start; i < end && i < communityCards.length; i++) {
      communityCards[i].style.display = "block";
    }
  });
}

// Run on load and resize
window.addEventListener("load", updateCarouselItems);
window.addEventListener("resize", updateCarouselItems);
function updateCarouselItems() {
  if (typeof window === "undefined") return; // Ensure it's running in the browser

  let screenWidth = window.innerWidth;
  let cardsPerSlide = screenWidth >= 1200 ? 3 : screenWidth >= 768 ? 2 : 1; // 3 for large, 2 for tablets, 1 for mobile

  let carouselInner = document.querySelector(".carousel-inner");
  let communityCards = document.querySelectorAll(".community-card");

  // Clear existing slides
  carouselInner.innerHTML = "";

  for (let i = 0; i < communityCards.length; i += cardsPerSlide) {
      let carouselItem = document.createElement("div");
      carouselItem.classList.add("carousel-item");

      if (i === 0) carouselItem.classList.add("active"); // Make the first slide active

      let row = document.createElement("div");
      row.classList.add("row", "gy-4", "justify-content-center"); // Center alignment

      for (let j = i; j < i + cardsPerSlide && j < communityCards.length; j++) {
          let col = document.createElement("div");

          // Adjust column width dynamically
          if (cardsPerSlide === 3) {
              col.classList.add("col-md-4", "col-sm-6");
          } else if (cardsPerSlide === 2) {
              col.classList.add("col-md-6", "col-sm-6"); // Two equal width columns
          } else {
              col.classList.add("col-12"); // Full width for single card
          }

          col.appendChild(communityCards[j].cloneNode(true)); // Clone cards into new structure
          row.appendChild(col);
      }

      carouselItem.appendChild(row);
      carouselInner.appendChild(carouselItem);
  }
}
document.addEventListener("DOMContentLoaded", function () {
  function handleMultiSelect(menuId, selectedContainerId, checkboxClass) {
    const menu = document.getElementById(menuId);
    const selectedContainer = document.getElementById(selectedContainerId);

    menu.querySelectorAll(`.${checkboxClass}`).forEach(checkbox => {
      checkbox.addEventListener("change", function () {
        const value = this.value;

        if (this.checked) {
          // Check if item is already selected
          if (selectedContainer.querySelector(`[data-value="${value}"]`)) return;

          // Create selected item
          const selectedItem = document.createElement("div");
          selectedItem.classList.add("selected-item", "badge", "bg-primary", "me-2", "p-2");
          selectedItem.setAttribute("data-value", value);
          selectedItem.innerHTML = `${value} <span class="remove-option" style="cursor:pointer;">❌</span>`;

          // Remove item when clicked
          selectedItem.querySelector(".remove-option").addEventListener("click", function () {
            checkbox.checked = false;
            selectedItem.remove();
          });

          selectedContainer.appendChild(selectedItem);
        } else {
          // Remove if unchecked
          selectedContainer.querySelector(`[data-value="${value}"]`)?.remove();
        }
      });
    });
  }

  // Attach multi-select to all dropdowns
  handleMultiSelect("locationMenu", "selected-location", "location-checkbox");
  handleMultiSelect("amenitiesMenu", "selected-amenities", "amenities-checkbox");
  handleMultiSelect("priceMenu", "selected-price", "price-checkbox");

  // Handle Buttons
  document.querySelector(".btn-primary:nth-child(1)").addEventListener("click", function () {
    alert("Searching Communities..."); // Replace with your actual search function
  });

  document.querySelector(".btn-primary:nth-child(2)").addEventListener("click", function () {
    alert("Viewing All Communities..."); // Replace with your actual view function
  });
});

  function updateForm(subject) {
    // Select the subject dropdown
    const subjectDropdown = document.getElementById("subject");

    if (subjectDropdown) {
      // Set the selected option
      for (let option of subjectDropdown.options) {
        if (option.value === subject) {
          option.selected = true;
          break;
        }
      }
    }

    // Smoothly scroll to the form
    document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
  }
  document.getElementById("contact-form").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent default form submission

    // Validate all fields
    let name = document.getElementById("name").value.trim();
    let email = document.getElementById("email").value.trim();
    let subject = document.getElementById("subject").value;
    let message = document.getElementById("message").value.trim();

    if (name === "" || email === "" || subject === "" || message === "") {
        alert("Please fill out all fields before submitting.");
        return;
    }

    // If all fields are filled, show success message
    document.getElementById("success-message").style.display = "block";

    // Reset the form after successful submission
    document.getElementById("contact-form").reset();

    // Hide success message after 3 seconds
    setTimeout(() => {
        document.getElementById("success-message").style.display = "none";
    }, 3000);
});
