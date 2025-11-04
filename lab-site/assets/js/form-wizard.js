(function() {
  'use strict';

  const form = document.getElementById('projectForm');
  if (!form) return;

  let currentStep = 1;
  const totalSteps = 6;
  const formData = {};

  // Update progress indicator
  function updateProgress() {
    document.querySelectorAll('.progress-step').forEach((step, idx) => {
      const stepNum = idx + 1;
      step.classList.remove('active', 'completed');
      if (stepNum === currentStep) {
        step.classList.add('active');
      } else if (stepNum < currentStep) {
        step.classList.add('completed');
      }
    });
  }

  // Show/hide steps
  function showStep(n) {
    document.querySelectorAll('.wizard-step').forEach(step => {
      step.classList.remove('active');
    });
    const target = document.querySelector(`.wizard-step[data-step="${n}"]`);
    if (target) {
      target.classList.add('active');
      updateProgress();
      if (n === totalSteps) buildReviewSummary();
    }
  }

  // Collect form data
  function collectStepData(stepNum) {
    const step = document.querySelector(`.wizard-step[data-step="${stepNum}"]`);
    if (!step) return;
    
    const inputs = step.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (input.type === 'checkbox' || input.type === 'radio') {
        if (input.checked) {
          if (input.name === 'integrations') {
            if (!formData.integrations) formData.integrations = [];
            formData.integrations.push(input.value);
          } else {
            formData[input.name] = input.value;
          }
        }
      } else if (input.type !== 'submit' && input.type !== 'button') {
        if (input.value) formData[input.name] = input.value;
      }
    });
  }

  // Build review summary
  function buildReviewSummary() {
    const summary = document.getElementById('reviewSummary');
    if (!summary) return;

    const projectTypes = {
      hardware_test: 'Hardware Test Application',
      management_system: 'Company Management System',
      web_app: 'Web Application',
      python_app: 'Python Application',
      other: 'Other'
    };

    summary.innerHTML = `
      <h3>Review Your Submission</h3>
      <p><strong>Contact:</strong> ${formData.name || ''} (${formData.email || ''})${formData.company ? ` at ${formData.company}` : ''}</p>
      <p><strong>Project Type:</strong> ${projectTypes[formData.project_type] || 'Not specified'}</p>
      <p><strong>Description:</strong> ${formData.description || 'Not provided'}</p>
      ${formData.must_haves ? `<p><strong>Must-haves:</strong> ${formData.must_haves}</p>` : ''}
      ${formData.users ? `<p><strong>Target Users:</strong> ${formData.users}</p>` : ''}
      ${formData.integrations && formData.integrations.length ? `<p><strong>Integrations:</strong> ${formData.integrations.join(', ')}</p>` : ''}
      ${formData.deadline ? `<p><strong>Deadline:</strong> ${new Date(formData.deadline).toLocaleDateString()}</p>` : ''}
      ${formData.budget ? `<p><strong>Budget:</strong> ${formData.budget.replace(/-/g, ' - ').replace(/k/g, 'k').replace(/under/g, 'Under')}</p>` : ''}
    `;
  }

  // Validate step fields
  function validateStep(stepNum) {
    const step = document.querySelector(`.wizard-step[data-step="${stepNum}"]`);
    if (!step) return false;
    const requiredInputs = step.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    requiredInputs.forEach(input => {
      if (!input.value.trim()) {
        isValid = false;
        input.setCustomValidity('This field is required');
      } else {
        input.setCustomValidity('');
      }
      if (!input.checkValidity()) {
        isValid = false;
      }
    });
    // Special check for radio groups (at least one must be selected)
    const radioGroups = step.querySelectorAll('input[type="radio"][required]');
    if (radioGroups.length > 0) {
      const groupName = radioGroups[0].name;
      const groupChecked = step.querySelector(`input[type="radio"][name="${groupName}"]:checked`);
      if (!groupChecked) {
        isValid = false;
        radioGroups[0].setCustomValidity('Please select an option');
      } else {
        radioGroups.forEach(r => r.setCustomValidity(''));
      }
    }
    return isValid;
  }

  // Navigation handlers
  form.addEventListener('click', (e) => {
    if (e.target.classList.contains('wizard-next')) {
      e.preventDefault();
      const step = document.querySelector(`.wizard-step[data-step="${currentStep}"]`);
      if (step && validateStep(currentStep)) {
        collectStepData(currentStep);
        if (currentStep < totalSteps) {
          currentStep++;
          showStep(currentStep);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        // Trigger validation UI
        const firstInvalid = step.querySelector('input:invalid, select:invalid, textarea:invalid');
        if (firstInvalid) {
          firstInvalid.focus();
          firstInvalid.reportValidity();
        }
      }
    }
    
    if (e.target.classList.contains('wizard-prev')) {
      e.preventDefault();
      if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  });

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    collectStepData(currentStep);
    
    // Build email body
    const subject = encodeURIComponent(`New Project Request: ${formData.project_type || 'Unknown'}`);
    const body = encodeURIComponent(`
New Project Submission from ${formData.name || 'Unknown'}

CONTACT INFORMATION:
Name: ${formData.name || 'N/A'}
Email: ${formData.email || 'N/A'}
Phone: ${formData.phone || 'N/A'}
Company: ${formData.company || 'N/A'}

PROJECT DETAILS:
Type: ${formData.project_type || 'N/A'}
Description: ${formData.description || 'N/A'}

REQUIREMENTS:
Must-haves: ${formData.must_haves || 'N/A'}
Nice-to-haves: ${formData.nice_to_haves || 'N/A'}
Target Users: ${formData.users || 'N/A'}
User Count: ${formData.user_count || 'N/A'}

INTEGRATIONS:
${formData.integrations && formData.integrations.length ? formData.integrations.join(', ') : 'None specified'}
Details: ${formData.integration_details || 'N/A'}

TIMELINE & BUDGET:
Deadline: ${formData.deadline || 'N/A'}
Flexible: ${formData.timeline_flexible || 'N/A'}
Budget: ${formData.budget || 'N/A'}
Delivery: ${formData.delivery || 'N/A'}

NOTES:
${formData.notes || 'None'}
NDA Acceptable: ${formData.nda === 'yes' ? 'Yes' : 'No'}
    `.trim());

    // Send email (or submit to endpoint)
    window.location.href = `mailto:info@mik-webservices.co.uk?subject=${subject}&body=${body}`;
    
    // Show success message (optional)
    alert('Thank you! Your project request has been prepared. Please send the email that opens to submit it. We\'ll review and get back to you within 24 hours.');
  });

  // Initialize
  updateProgress();
})();


