function navigateCampus(){

    const destination =
    document.getElementById("destination").value;

    document.getElementById("result").innerHTML =
    `
    Current Location: Main Gate <br><br>

    Destination: ${destination} <br><br>

    Step 1: Walk straight 50 meters <br>
    Step 2: Turn left <br>
    Step 3: Reach destination
    `;
}