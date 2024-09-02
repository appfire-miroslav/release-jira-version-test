const core = require('@actions/core');
// const github = require('@actions/github');

// NOTE: As it is, it appears that releasing a version does NOT move its assigned issues from "Waiting for Release" to "Done".

const APPFIRE_JIRA_BASE_URL = "https://appfire.atlassian.net"

const jiraProject = core.getInput("jira-project-key")
const jiraUsername = core.getInput("jira-username")
const jiraApiToken = core.getInput("jira-api-token")
const currentVersion = core.getInput("current-version")
const nextVersion = core.getInput("next-version")

// Fetch current version id
const currentVersionData = await fetch(`${APPFIRE_JIRA_BASE_URL}/rest/api/3/project/${jiraProject}/version?startAt=0&maxResults=1&query=${currentVersion}`, {
    headers: {
        "Authorization": `Basic ${Buffer.from(`${jiraUsername}:${jiraApiToken}`).toString('base64')}`,
        "Accept": "application/json"
    }
})
    .then(response => {
        console.log(
            `Fetch current version response: ${response.status} ${response.statusText}`
        );
    })
    .then(resp => resp.json())
    .then(resp => JSON.parse(resp).values[0]) // exceptionally cursed object access
    .catch(err => console.error(err));

// Release current version
await fetch(`${APPFIRE_JIRA_BASE_URL}/rest/api/3/version/${currentVersionData.id}`, {
        method: "PUT",
        headers: {
            "Authorization": `Basic ${Buffer.from(`${jiraUsername}:${jiraApiToken}`).toString('base64')}`,
            "Accept": "application/json"
        },
        body: JSON.stringify({
            released: true,
            releaseDate: new Date().toISOString().slice(0, 10) // YYYY-mm-dd
        })
    })
    .then(response => {
        console.log(
            `Release version response: ${response.status} ${response.statusText}`
        );
    })
    .catch(err => console.error(err));

// Create next version
await fetch(`${APPFIRE_JIRA_BASE_URL}/rest/api/3/version`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(`${jiraUsername}:${jiraApiToken}`).toString('base64')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: {
            "name": nextVersion,
            "projectId": currentVersionData.projectId,
            "startDate": new Date().toISOString().slice(0, 10), // YYYY-mm-dd
            "released": false
        }
    })
    .then(response => {
        console.log(
            `Create next version response: ${response.status} ${response.statusText}`
        );
    })
    .catch(err => console.error(err));
