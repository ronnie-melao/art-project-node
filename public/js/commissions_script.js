function populateCommissionsTable() {
    const tableBody = document.querySelector("#incoming_requests tbody");
    // Clear existing rows
    tableBody.innerHTML = '';
  
    // Iterate over requestData and create table rows
    commissionsArray.forEach(request => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${request.name}</td>
        <td>${request.description}</td>
        <td>${request.price}</td>
        <td>${request.status}</td>
      `;
      tableBody.appendChild(row);
    });
  }

if (commissionsArray.length > 0)
    populateCommissionsTable();