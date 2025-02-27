if (commissionsArray) {
  function populateCommissionsTable() {
    const tableBody = document.querySelector("#incoming_requests tbody");
    // Clear existing rows
    tableBody.innerHTML = "";

    // Iterate over commissionsArray and create table rows
    commissionsArray.forEach((request, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${request.requesterUsername}</td>
          <td>${request.description}</td>
          <td>$${request.price}</td>
          <td>
          <select id="status_${index}" data-id="${request._id}">
          <option value="Pending" ${request.status === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Accepted" ${request.status === "Accepted" ? "selected" : ""}>Accepted</option>
          <option value="Denied" ${request.status === "Denied" ? "selected" : ""}>Denied</option>
          <option value="Completed" ${request.status === "Completed" ? "selected" : ""}>Completed</option>
          </select>
        </td>
        `;
      tableBody.appendChild(row);
    });
  }

  if (commissionsArray.length > 0)
    populateCommissionsTable();

  if (commissionsArray.length === 0) {
    const p = document.createElement("p");
    p.textContent = "There are no incoming commission requests.";
    const incomingDiv = document.getElementById("incoming_div");
    incomingDiv.appendChild(p);
  }


  document.querySelectorAll('select').forEach(select => {
    select.addEventListener('change', async event => {
      const commissionId = event.target.getAttribute('data-id')
      const newStatus = event.target.value;
      
      try {
        const response = await fetch('/commissions/change-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ commissionId, newStatus })
        });

        if (!response.ok) {
          throw new Error('Failed to update status');
        }

        // Handle success response
        console.log('Status updated successfully');
      } catch (error) {
        console.error('Error updating status:', error.message);
      }
    });
  });
}

function populateOutgoingCommissionsTable() {
  const tableBody = document.querySelector("#outgoing_requests tbody");
  // Clear existing rows
  tableBody.innerHTML = "";

  // Iterate over outgoingCommissionsArray and create table rows
  outgoingCommissionsArray.forEach((request, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${request.artistUsername}</td>
      <td>${request.description}</td>
      <td>$${request.price}</td>
      <td>${request.status}</td>
    `;
    tableBody.appendChild(row);
  });
}

if (outgoingCommissionsArray.length > 0)
  populateOutgoingCommissionsTable();

if (outgoingCommissionsArray.length === 0) {
  const p = document.createElement("p");
  p.textContent = "There are no outgoing commission requests.";
  const incomingDiv = document.getElementById("outgoing_div");
  incomingDiv.appendChild(p);
}