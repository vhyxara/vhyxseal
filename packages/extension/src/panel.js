// VhyxSeal DevTools Panel
// Read-only — zero write operations.
// Fetches /__agent__/manifest.json from the active tab's domain.

'use strict';

// Error messages for three distinct states
var STATE_NOT_FOUND_MSG =
  'VhyxSeal not detected on this page.\nInstall @vhyxseal/nextjs to enable agent-readable contracts.';
var STATE_ERROR_NETWORK_MSG =
  'Could not read VhyxSeal manifest.\nThe server may be offline or the manifest endpoint may not be configured.';
var STATE_ERROR_FORMAT_MSG =
  'VhyxSeal manifest returned unexpected format.\nCheck @vhyxseal/nextjs configuration.';

// Required fields that must be present for a valid manifest
var REQUIRED_FIELDS = ['fingerprint', 'contracts', 'generatedAt'];

// ---------- DOM helpers ----------

function $(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  var el = $(id);
  if (el) el.textContent = text;
}

// ---------- State display functions ----------

function showLoading() {
  $('state-loading').style.display = '';
  $('state-not-found').style.display = 'none';
  $('state-error').style.display = 'none';
  $('panel-content').style.display = 'none';
}

function showNotFound() {
  $('state-loading').style.display = 'none';
  $('state-not-found').style.display = '';
  // state-not-found already styled gray via CSS (.status-neutral in panel.css)
  $('state-error').style.display = 'none';
  $('panel-content').style.display = 'none';
}

function showError(message) {
  $('state-loading').style.display = 'none';
  $('state-not-found').style.display = 'none';
  var errEl = $('state-error');
  errEl.textContent = message;
  errEl.style.display = '';
  // state-error already styled red via CSS in panel.css
  $('panel-content').style.display = 'none';
}

function showContent(manifest, domain) {
  $('state-loading').style.display = 'none';
  $('state-not-found').style.display = 'none';
  $('state-error').style.display = 'none';
  $('panel-content').style.display = '';
  populateContent(manifest, domain);
}

// ---------- Content population ----------

function populateContent(manifest, domain) {
  // Header domain
  setText('tab-domain', domain);

  // Contract Summary
  var contracts = Array.isArray(manifest.contracts) ? manifest.contracts : [];
  var total = contracts.length;
  var fullCount = contracts.filter(function(c) {
    return c.verifiedBy === 'manual' || c.verifiedBy === 'test';
  }).length;
  var inferredCount = contracts.filter(function(c) {
    return c.verifiedBy === 'auto';
  }).length;

  setText('cov-total', String(total));
  setText('cov-full', String(fullCount));
  setText('cov-inferred', String(inferredCount));
  setText('cov-pct', total > 0
    ? Math.round((fullCount / total) * 100) + '%'
    : '—'
  );

  // Manifest Info
  var fingerprint = String(manifest.fingerprint || '');
  setText('info-fingerprint',
    fingerprint.length > 0
      ? fingerprint.substring(0, 16) + '...'
      : '—'
  );
  setText('info-generated', manifest.generatedAt || '—');
  setText('info-version', manifest.vhyxseal || '—');

  // Agent Policy
  var policy = manifest.agentPolicy;
  var allowedAgents = (policy && Array.isArray(policy.allowedAgents) && policy.allowedAgents.length > 0)
    ? policy.allowedAgents.join(', ')
    : 'all (*)';
  setText('ap-agents', allowedAgents);
  setText('ap-access', (policy && policy.manifestAccess) ? policy.manifestAccess : '—');
}

// ---------- Manifest validation ----------

function validateManifest(obj) {
  // Returns true if all required fields are present
  for (var i = 0; i < REQUIRED_FIELDS.length; i++) {
    if (!(REQUIRED_FIELDS[i] in obj)) {
      return false;
    }
  }
  return true;
}

// ---------- Main fetch logic ----------

/**
 * Fetches /__agent__/manifest.json from the given tab URL's origin.
 * Separated from loadManifest() so it can be called by the
 * chrome.devtools.inspectedWindow.eval callback without nesting.
 */
function fetchManifest(tabUrl) {
  var origin;
  try {
    origin = new URL(tabUrl).origin;
  } catch (_e) {
    showError(STATE_ERROR_NETWORK_MSG);
    return;
  }

  // Extract domain for display (hostname only)
  var domain;
  try {
    domain = new URL(tabUrl).hostname;
  } catch (_e) {
    domain = origin;
  }

  var manifestUrl = origin + '/__agent__/manifest.json';

  fetch(manifestUrl)
    .then(function(response) {
      // State 1: 404 → VhyxSeal not detected
      if (response.status === 404) {
        showNotFound();
        return null;
      }

      // State 2: non-200, non-404 → fetch failed / server error
      if (response.status !== 200) {
        showError(STATE_ERROR_NETWORK_MSG);
        return null;
      }

      // 200 — try to parse JSON
      return response.text().then(function(text) {
        var obj;
        try {
          obj = JSON.parse(text);
        } catch (_parseErr) {
          // State 3: JSON parse error → unexpected format
          showError(STATE_ERROR_FORMAT_MSG);
          return;
        }

        // State 3: missing required fields → unexpected format
        if (typeof obj !== 'object' || obj === null || !validateManifest(obj)) {
          showError(STATE_ERROR_FORMAT_MSG);
          return;
        }

        // All checks pass → show panel content
        showContent(obj, domain);
      });
    })
    .catch(function(_networkErr) {
      // State 2: fetch() threw (network error)
      showError(STATE_ERROR_NETWORK_MSG);
    });
}

function loadManifest() {
  showLoading();

  // Use chrome.devtools.inspectedWindow.eval to read the inspected page URL.
  // This is the documented DevTools API — no 'tabs' permission required.
  chrome.devtools.inspectedWindow.eval(
    'window.location.href',
    function(url, isException) {
      if (isException || !url) {
        showError(STATE_ERROR_NETWORK_MSG);
        return;
      }
      fetchManifest(url);
    }
  );
}

// ---------- Event wiring ----------

document.addEventListener('DOMContentLoaded', function() {
  var refreshBtn = $('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      loadManifest();
    });
  }
});

// Load manifest on panel open
loadManifest();
