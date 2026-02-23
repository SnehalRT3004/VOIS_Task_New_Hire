// Environment Variables
const {
  UIPATH_ORCHESTRATOR_URL,
  UIPATH_TENANT_NAME,
  UIPATH_CLIENT_ID,
  UIPATH_CLIENT_SECRET,
  UIPATH_ACCOUNT_NAME
} = process.env;

// Get Access Token
async function getAccessToken() {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", UIPATH_CLIENT_ID);
  params.append("client_secret", UIPATH_CLIENT_SECRET);
  params.append("scope", "OR.Queues OR.Queues.Write");

  const response = await fetch(
    "https://cloud.uipath.com/identity_/connect/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    }
  );

  const data = await response.json();
  return data.access_token;
}

// Fetch Employees
async function fetchEmployees() {
  const response = await fetch(
    "https://dummy.restapiexample.com/api/v1/employees"
  );

  const data = await response.json();
  return data.data;
}

// Priority Logic
function getPriority(salary) {
  if (salary > 300000) return "High";
  if (salary >= 100000) return "Normal";
  return "Low";
}

// Add Queue Item
async function addQueueItem(token, employee) {
  const url = `${UIPATH_ORCHESTRATOR_URL}/${UIPATH_ACCOUNT_NAME}/${UIPATH_TENANT_NAME}/odata/Queues/UiPathODataSvc.AddQueueItem`;

  const body = {
    itemData: {
      Name: "New Hires",
      Priority: getPriority(parseInt(employee.employee_salary)),
      SpecificContent: {
        id: employee.id,
        employee_name: employee.employee_name,
        employee_salary: employee.employee_salary,
        employee_age: employee.employee_age
      }
    }
  };

  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-UIPATH-OrganizationUnitId":"7560418"
    },
    body: JSON.stringify(body)
  });

  console.log(`Queued: ${employee.employee_name}`);
}

// Lambda Handler
exports.handler = async () => {
  try {
    console.log("Starting process...");

    const token = await getAccessToken();
    const employees = await fetchEmployees();

    for (const emp of employees) {
      await addQueueItem(token, emp);
    }

    return {
      statusCode: 200,
      body: "Employees successfully queued"
    };
  } catch (err) {
    console.error("ERROR:", err);
    return {
      statusCode: 500,
      body: "Error occurred"
    };
  }
};
