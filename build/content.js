console.log("CheatGPT Content Script Loaded");

// Function to display toast messages
function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.padding = "10px 20px";
  toast.style.borderRadius = "5px";
  toast.style.color = "white";
  toast.style.zIndex = "9999"; // Ensure it's on top
  toast.style.fontFamily = "sans-serif";
  toast.style.fontSize = "14px";
  toast.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";

  if (type === "success") {
    toast.style.backgroundColor = "#4CAF50"; // Green
  } else if (type === "error") {
    toast.style.backgroundColor = "#f44336"; // Red
  } else {
    toast.style.backgroundColor = "#2196F3"; // Blue for info/default
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}

document.addEventListener("keydown", (event) => {
  // Check if CTRL + 0 is pressed (or Command + 0 on Mac)
  if ((event.ctrlKey || event.metaKey) && event.key === "0") {
    event.preventDefault(); // Prevent default browser action
    const selectedText = window.getSelection()?.toString();

    if (selectedText && selectedText.trim() !== "") {
      console.log("Sending selected text to backend:", selectedText);

      // Send the text to the backend
      fetch("http://localhost:3000/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: selectedText }),
      })
        .then((response) => {
          if (!response.ok) {
            // Try to parse error message from backend first
            return response
              .json()
              .then((err) => {
                throw new Error(
                  err.error || `HTTP error! status: ${response.status}`
                );
              })
              .catch(() => {
                // If parsing fails or no specific error message, use status
                throw new Error(`HTTP error! status: ${response.status}`);
              });
          }
          return response.json(); // Parse JSON response
        })
        .then((data) => {
          console.log("Backend Response:", data);
          if (data.response) {
            console.log("--- Gemini Response ---");
            console.log(data.response);
            console.log("-----------------------");

            // Copy to clipboard
            navigator.clipboard
              .writeText(data.response)
              .then(() => {
                showToast("Success! Response copied to clipboard.", "success");
              })
              .catch((err) => {
                console.error("Failed to copy text: ", err);
                showToast(
                  "Success! (But failed to copy to clipboard)",
                  "success"
                ); // Still show success, but mention copy failure
              });
          } else {
            console.warn(
              "No Gemini response received from backend.",
              data.message
            );
            showToast(
              `Backend Message: ${data.message || "No specific response."}`,
              "info"
            );
          }
        })
        .catch((error) => {
          console.error(
            "Error sending text to backend or processing response:",
            error
          );
          // Show error toast
          showToast(`Error: ${error.message}`, "error");
        });
    } else {
      console.log("No text selected or selected text is empty.");
      showToast("No text selected.", "info");
    }
  }
});
