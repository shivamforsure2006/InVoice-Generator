/**
 * Invoicely - Modern Blue & White Invoice Generator
 * Core Application Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // State & Data Models
  // =========================================================================
  const STORAGE_KEYS = {
    SAVED_INVOICES: 'invoicely_saved_invoices_v1',
    DEFAULT_SENDER: 'invoicely_default_sender_v1',
    AUTOSAVE_DRAFT: 'invoicely_current_draft_v1'
  };

  const CURRENCY_MAP = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    CAD: 'CA$',
    AUD: 'AU$',
    JPY: '¥',
    SGD: 'SG$',
    AED: 'AED '
  };

  // Preset services for quick adding
  const SERVICE_PRESETS = {
    'web-dev': {
      title: 'Full-Stack Web Application Development',
      subtext: 'Custom React & Node.js architecture with responsive design and database integration',
      qty: 1,
      price: 2400
    },
    'ui-ux': {
      title: 'UI/UX Interface & Interaction Design',
      subtext: 'High-fidelity wireframes, interactive prototypes, and design system components',
      qty: 1,
      price: 1200
    },
    'brand': {
      title: 'Brand Identity & Visual Assets',
      subtext: 'Logo variations, typography guide, color palette, and social media brand kit',
      qty: 1,
      price: 950
    },
    'consulting': {
      title: 'Technical Architecture & Code Review',
      subtext: 'Comprehensive architectural audit, security inspection, and performance roadmap',
      qty: 8,
      price: 150
    },
    'seo': {
      title: 'Technical SEO & Core Web Vitals Audit',
      subtext: 'Structured schema markup, page speed optimization, and search index audit',
      qty: 1,
      price: 650
    },
    'cloud': {
      title: 'Cloud Infrastructure & CI/CD Deployment',
      subtext: 'Automated deployment pipelines, Docker containerization, and SSL configuration',
      qty: 1,
      price: 800
    }
  };

  // Initial Sample Invoice
  const SAMPLE_INVOICE = {
    id: 'sample-inv-001',
    template: 'modern-royal',
    number: 'INV-2026-001',
    poNumber: 'PO-98421',
    date: new Date().toISOString().split('T')[0],
    dueDate: getRelativeDate(15),
    status: 'PENDING',
    currency: 'USD',
    sender: {
      name: 'Apex Digital Solutions LLC',
      taxId: 'US987654321',
      email: 'billing@apexdigital.io',
      phone: '+1 (555) 234-5678',
      address: '100 Innovation Way, Suite 400',
      city: 'San Francisco',
      state: 'CA 94105',
      country: 'United States',
      website: 'https://apexdigital.io',
      logo: ''
    },
    client: {
      company: 'Horizon Global Media',
      contact: 'Sarah Jenkins (Procurement Lead)',
      email: 'accounts@horizonglobal.com',
      phone: '+1 (555) 987-6543',
      address: '742 Evergreen Terrace, Floor 12',
      city: 'New York',
      state: 'NY 10001',
      country: 'United States',
      taxId: 'EU987654321'
    },
    items: [
      {
        id: 'item-1',
        title: 'Full-Stack Web Application Development',
        subtext: 'Custom React & Node.js architecture with responsive UI and API endpoints',
        qty: 1,
        price: 2400
      },
      {
        id: 'item-2',
        title: 'UI/UX Interface & Interactive Design',
        subtext: 'User journey mapping, design token system, and interactive mobile prototype',
        qty: 1,
        price: 1200
      },
      {
        id: 'item-3',
        title: 'Cloud Infrastructure & Automated CI/CD',
        subtext: 'Docker containerization, AWS setup, and automated testing deployment pipeline',
        qty: 1,
        price: 800
      }
    ],
    tax: {
      rate: 10,
      label: 'Sales Tax'
    },
    discount: {
      value: 0,
      type: 'percent'
    },
    shipping: 0,
    paid: 0,
    payment: {
      bankName: 'Chase Commercial Bank',
      account: '1234 5678 9012 3456',
      routing: 'CHASUS33',
      note: 'payments@apexdigital.io'
    },
    notes: 'Thank you for partnering with us! We appreciate your business and look forward to future collaborations.',
    terms: 'Payment is due within 15 days of invoice date. Please transfer funds to the bank account listed above.',
    signature: {
      name: 'Alex Morgan',
      title: 'Managing Director'
    }
  };

  // Current Working State
  let currentInvoice = JSON.parse(JSON.stringify(SAMPLE_INVOICE));
  let savedInvoices = loadSavedInvoicesFromStorage();
  let currentZoom = 1;

  // =========================================================================
  // DOM Elements Selection
  // =========================================================================
  const dom = {
    // Header & Global Buttons
    btnNew: document.getElementById('btnNewInvoice'),
    btnLoadSample: document.getElementById('btnLoadSample'),
    btnOpenSaved: document.getElementById('btnOpenSaved'),
    btnSave: document.getElementById('btnSaveInvoice'),
    btnPrint: document.getElementById('btnPrintInvoice'),
    btnDownloadPDF: document.getElementById('btnDownloadPDF'),
    savedCountBadge: document.getElementById('savedCountBadge'),
    viewTogglePills: document.getElementById('viewTogglePills'),
    btnViewEditor: document.getElementById('btnViewEditor'),
    btnViewPreview: document.getElementById('btnViewPreview'),
    workspace: document.querySelector('.main-workspace'),

    // Template Radio Pickers
    templateLabels: document.querySelectorAll('.template-radio-label'),

    // Invoice Meta Inputs
    invNumber: document.getElementById('invNumber'),
    invPoNumber: document.getElementById('invPoNumber'),
    invCurrency: document.getElementById('invCurrency'),
    invDate: document.getElementById('invDate'),
    invDueDate: document.getElementById('invDueDate'),
    invStatus: document.getElementById('invStatus'),
    duePillBtns: document.querySelectorAll('.terms-quick-pills .pill-btn'),

    // Sender Inputs
    senderName: document.getElementById('senderName'),
    senderTaxId: document.getElementById('senderTaxId'),
    senderEmail: document.getElementById('senderEmail'),
    senderPhone: document.getElementById('senderPhone'),
    senderAddress: document.getElementById('senderAddress'),
    senderCity: document.getElementById('senderCity'),
    senderState: document.getElementById('senderState'),
    senderCountry: document.getElementById('senderCountry'),
    senderWebsite: document.getElementById('senderWebsite'),
    btnSaveDefaultBusiness: document.getElementById('btnSaveDefaultBusiness'),

    // Logo Upload
    logoDropZone: document.getElementById('logoDropZone'),
    logoFileInput: document.getElementById('logoFileInput'),
    logoPreviewWrapper: document.getElementById('logoPreviewWrapper'),
    logoPreviewImg: document.getElementById('logoPreviewImg'),
    logoPlaceholder: document.getElementById('logoPlaceholder'),
    btnRemoveLogo: document.getElementById('btnRemoveLogo'),

    // Client Inputs
    clientCompany: document.getElementById('clientCompany'),
    clientContact: document.getElementById('clientContact'),
    clientEmail: document.getElementById('clientEmail'),
    clientPhone: document.getElementById('clientPhone'),
    clientAddress: document.getElementById('clientAddress'),
    clientCity: document.getElementById('clientCity'),
    clientState: document.getElementById('clientState'),
    clientCountry: document.getElementById('clientCountry'),
    clientTaxId: document.getElementById('clientTaxId'),

    // Items Section
    itemsTableBody: document.getElementById('itemsTableBody'),
    btnAddItem: document.getElementById('btnAddItem'),
    quickServiceSelect: document.getElementById('quickServiceSelect'),

    // Totals & Adjustments
    taxRate: document.getElementById('taxRate'),
    taxLabel: document.getElementById('taxLabel'),
    discountValue: document.getElementById('discountValue'),
    discountType: document.getElementById('discountType'),
    shippingFee: document.getElementById('shippingFee'),
    amountPaid: document.getElementById('amountPaid'),
    shippingCurrencyPrefix: document.getElementById('shippingCurrencyPrefix'),
    paidCurrencyPrefix: document.getElementById('paidCurrencyPrefix'),

    // Payment, Notes & Signature
    bankName: document.getElementById('bankName'),
    bankAccount: document.getElementById('bankAccount'),
    bankRouting: document.getElementById('bankRouting'),
    paymentNote: document.getElementById('paymentNote'),
    clientNotes: document.getElementById('clientNotes'),
    termsConditions: document.getElementById('termsConditions'),
    signatureName: document.getElementById('signatureName'),
    signatureTitle: document.getElementById('signatureTitle'),

    // Live Document Elements
    invoicePaper: document.getElementById('invoicePaper'),
    previewCanvasWrapper: document.getElementById('previewCanvasWrapper'),
    docLogoFallback: document.getElementById('docLogoFallback'),
    docLogoImg: document.getElementById('docLogoImg'),
    docSenderName: document.getElementById('docSenderName'),
    docSenderAddress: document.getElementById('docSenderAddress'),
    docSenderContact: document.getElementById('docSenderContact'),
    docSenderEmail: document.getElementById('docSenderEmail'),
    docSenderPhone: document.getElementById('docSenderPhone'),
    docSenderTaxWrap: document.getElementById('docSenderTaxWrap'),
    docSenderTax: document.getElementById('docSenderTax'),
    docStatusPill: document.getElementById('docStatusPill'),
    docInvNumber: document.getElementById('docInvNumber'),
    docPoRow: document.getElementById('docPoRow'),
    docPoNumber: document.getElementById('docPoNumber'),
    docDate: document.getElementById('docDate'),
    docDueDate: document.getElementById('docDueDate'),
    docClientCompany: document.getElementById('docClientCompany'),
    docClientContact: document.getElementById('docClientContact'),
    docClientAddress: document.getElementById('docClientAddress'),
    docClientEmail: document.getElementById('docClientEmail'),
    docClientPhone: document.getElementById('docClientPhone'),
    docClientTaxWrap: document.getElementById('docClientTaxWrap'),
    docClientTax: document.getElementById('docClientTax'),
    docHeaderTotal: document.getElementById('docHeaderTotal'),
    docCurrencyCode: document.getElementById('docCurrencyCode'),
    docTermsPreview: document.getElementById('docTermsPreview'),
    docItemsTbody: document.getElementById('docItemsTbody'),
    docBankingBox: document.getElementById('docBankingBox'),
    docBankNameRow: document.getElementById('docBankNameRow'),
    docBankName: document.getElementById('docBankName'),
    docBankAccountRow: document.getElementById('docBankAccountRow'),
    docBankAccount: document.getElementById('docBankAccount'),
    docBankRoutingRow: document.getElementById('docBankRoutingRow'),
    docBankRouting: document.getElementById('docBankRouting'),
    docPaymentNoteRow: document.getElementById('docPaymentNoteRow'),
    docPaymentNote: document.getElementById('docPaymentNote'),
    docNoteBox: document.getElementById('docNoteBox'),
    docClientNoteText: document.getElementById('docClientNoteText'),
    docTermsBox: document.getElementById('docTermsBox'),
    docTermsText: document.getElementById('docTermsText'),
    docSubtotal: document.getElementById('docSubtotal'),
    docDiscountRow: document.getElementById('docDiscountRow'),
    docDiscountRateText: document.getElementById('docDiscountRateText'),
    docDiscount: document.getElementById('docDiscount'),
    docTaxRow: document.getElementById('docTaxRow'),
    docTaxLabel: document.getElementById('docTaxLabel'),
    docTaxRate: document.getElementById('docTaxRate'),
    docTax: document.getElementById('docTax'),
    docShippingRow: document.getElementById('docShippingRow'),
    docShipping: document.getElementById('docShipping'),
    docGrandTotal: document.getElementById('docGrandTotal'),
    docPaidRow: document.getElementById('docPaidRow'),
    docPaid: document.getElementById('docPaid'),
    docBalanceDueRow: document.getElementById('docBalanceDueRow'),
    docBalanceDue: document.getElementById('docBalanceDue'),
    docSignatureHandwritten: document.getElementById('docSignatureHandwritten'),
    docSigName: document.getElementById('docSigName'),
    docSigTitle: document.getElementById('docSigTitle'),
    docFooterEmail: document.getElementById('docFooterEmail'),

    // Zoom Controls
    btnZoomIn: document.getElementById('btnZoomIn'),
    btnZoomOut: document.getElementById('btnZoomOut'),
    btnZoomReset: document.getElementById('btnZoomReset'),
    zoomLevelText: document.getElementById('zoomLevelText'),
    btnToggleBg: document.getElementById('btnToggleBg'),

    // Drawer Elements
    savedDrawerOverlay: document.getElementById('savedDrawerOverlay'),
    savedDrawer: document.getElementById('savedDrawer'),
    btnCloseDrawer: document.getElementById('btnCloseDrawer'),
    savedSearchInput: document.getElementById('savedSearchInput'),
    savedFilterChips: document.querySelectorAll('.filter-chip'),
    savedInvoicesList: document.getElementById('savedInvoicesList'),
    btnExportAllData: document.getElementById('btnExportAllData'),
    importBackupInput: document.getElementById('importBackupInput'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  // =========================================================================
  // Initialize Application
  // =========================================================================
  initApp();

  function initApp() {
    // Check if auto-saved draft exists, else load sample invoice
    const draft = localStorage.getItem(STORAGE_KEYS.AUTOSAVE_DRAFT);
    if (draft) {
      try {
        currentInvoice = JSON.parse(draft);
      } catch (e) {
        currentInvoice = JSON.parse(JSON.stringify(SAMPLE_INVOICE));
      }
    } else {
      // If default sender exists, merge it
      const defaultSender = localStorage.getItem(STORAGE_KEYS.DEFAULT_SENDER);
      if (defaultSender) {
        try {
          currentInvoice.sender = JSON.parse(defaultSender);
        } catch (e) {}
      }
    }

    // Populate inputs from current state
    populateFormFromState();

    // Render items table
    renderItemsFormRows();

    // Update Live Document and Totals
    updateLiveDocument();

    // Update Saved Counter
    updateSavedCountBadge();

    // Bind event listeners
    bindEvents();
  }

  // =========================================================================
  // Form Populating & State Sync
  // =========================================================================
  function populateFormFromState() {
    // Template
    const template = currentInvoice.template || 'modern-royal';
    dom.templateLabels.forEach(label => {
      const radio = label.querySelector('input');
      const isMatch = label.dataset.template === template;
      radio.checked = isMatch;
      label.classList.toggle('active', isMatch);
    });
    applyTemplateClass(template);

    // Meta
    dom.invNumber.value = currentInvoice.number || '';
    dom.invPoNumber.value = currentInvoice.poNumber || '';
    dom.invCurrency.value = currentInvoice.currency || 'USD';
    dom.invDate.value = currentInvoice.date || new Date().toISOString().split('T')[0];
    dom.invDueDate.value = currentInvoice.dueDate || getRelativeDate(15);
    dom.invStatus.value = currentInvoice.status || 'PENDING';

    // Sender
    const s = currentInvoice.sender || {};
    dom.senderName.value = s.name || '';
    dom.senderTaxId.value = s.taxId || '';
    dom.senderEmail.value = s.email || '';
    dom.senderPhone.value = s.phone || '';
    dom.senderAddress.value = s.address || '';
    dom.senderCity.value = s.city || '';
    dom.senderState.value = s.state || '';
    dom.senderCountry.value = s.country || '';
    dom.senderWebsite.value = s.website || '';
    renderLogoPreview(s.logo);

    // Client
    const c = currentInvoice.client || {};
    dom.clientCompany.value = c.company || '';
    dom.clientContact.value = c.contact || '';
    dom.clientEmail.value = c.email || '';
    dom.clientPhone.value = c.phone || '';
    dom.clientAddress.value = c.address || '';
    dom.clientCity.value = c.city || '';
    dom.clientState.value = c.state || '';
    dom.clientCountry.value = c.country || '';
    dom.clientTaxId.value = c.taxId || '';

    // Taxes & Discounts
    dom.taxRate.value = currentInvoice.tax?.rate ?? 10;
    dom.taxLabel.value = currentInvoice.tax?.label ?? 'Sales Tax';
    dom.discountValue.value = currentInvoice.discount?.value ?? 0;
    dom.discountType.value = currentInvoice.discount?.type ?? 'percent';
    dom.shippingFee.value = currentInvoice.shipping ?? 0;
    dom.amountPaid.value = currentInvoice.paid ?? 0;

    // Payment & Notes
    const p = currentInvoice.payment || {};
    dom.bankName.value = p.bankName || '';
    dom.bankAccount.value = p.account || '';
    dom.bankRouting.value = p.routing || '';
    dom.paymentNote.value = p.note || '';
    dom.clientNotes.value = currentInvoice.notes || '';
    dom.termsConditions.value = currentInvoice.terms || '';

    // Signature
    const sig = currentInvoice.signature || {};
    dom.signatureName.value = sig.name || '';
    dom.signatureTitle.value = sig.title || '';

    // Currency Prefixes
    updateCurrencySymbols();
  }

  function readFormIntoState() {
    // Template
    const activeRadio = document.querySelector('input[name="invoiceTemplate"]:checked');
    currentInvoice.template = activeRadio ? activeRadio.value : 'modern-royal';

    // Meta
    currentInvoice.number = dom.invNumber.value.trim();
    currentInvoice.poNumber = dom.invPoNumber.value.trim();
    currentInvoice.currency = dom.invCurrency.value;
    currentInvoice.date = dom.invDate.value;
    currentInvoice.dueDate = dom.invDueDate.value;
    currentInvoice.status = dom.invStatus.value;

    // Sender
    currentInvoice.sender = currentInvoice.sender || {};
    currentInvoice.sender.name = dom.senderName.value.trim();
    currentInvoice.sender.taxId = dom.senderTaxId.value.trim();
    currentInvoice.sender.email = dom.senderEmail.value.trim();
    currentInvoice.sender.phone = dom.senderPhone.value.trim();
    currentInvoice.sender.address = dom.senderAddress.value.trim();
    currentInvoice.sender.city = dom.senderCity.value.trim();
    currentInvoice.sender.state = dom.senderState.value.trim();
    currentInvoice.sender.country = dom.senderCountry.value.trim();
    currentInvoice.sender.website = dom.senderWebsite.value.trim();

    // Client
    currentInvoice.client = currentInvoice.client || {};
    currentInvoice.client.company = dom.clientCompany.value.trim();
    currentInvoice.client.contact = dom.clientContact.value.trim();
    currentInvoice.client.email = dom.clientEmail.value.trim();
    currentInvoice.client.phone = dom.clientPhone.value.trim();
    currentInvoice.client.address = dom.clientAddress.value.trim();
    currentInvoice.client.city = dom.clientCity.value.trim();
    currentInvoice.client.state = dom.clientState.value.trim();
    currentInvoice.client.country = dom.clientCountry.value.trim();
    currentInvoice.client.taxId = dom.clientTaxId.value.trim();

    // Line items read from table
    const itemRows = dom.itemsTableBody.querySelectorAll('.item-row');
    const items = [];
    itemRows.forEach(row => {
      const id = row.dataset.itemId;
      const title = row.querySelector('.item-title-input').value;
      const subtext = row.querySelector('.item-subtext-input').value;
      const qty = parseFloat(row.querySelector('.item-qty-input').value) || 0;
      const price = parseFloat(row.querySelector('.item-price-input').value) || 0;
      items.push({ id, title, subtext, qty, price });
    });
    currentInvoice.items = items;

    // Taxes & Discounts
    currentInvoice.tax = {
      rate: parseFloat(dom.taxRate.value) || 0,
      label: dom.taxLabel.value.trim() || 'Tax'
    };
    currentInvoice.discount = {
      value: parseFloat(dom.discountValue.value) || 0,
      type: dom.discountType.value
    };
    currentInvoice.shipping = parseFloat(dom.shippingFee.value) || 0;
    currentInvoice.paid = parseFloat(dom.amountPaid.value) || 0;

    // Payment & Notes
    currentInvoice.payment = {
      bankName: dom.bankName.value.trim(),
      account: dom.bankAccount.value.trim(),
      routing: dom.bankRouting.value.trim(),
      note: dom.paymentNote.value.trim()
    };
    currentInvoice.notes = dom.clientNotes.value.trim();
    currentInvoice.terms = dom.termsConditions.value.trim();

    // Signature
    currentInvoice.signature = {
      name: dom.signatureName.value.trim(),
      title: dom.signatureTitle.value.trim()
    };

    // Auto-save draft
    saveDraft();
  }

  // =========================================================================
  // Line Items Form Rendering
  // =========================================================================
  function renderItemsFormRows() {
    dom.itemsTableBody.innerHTML = '';
    const symbol = CURRENCY_MAP[currentInvoice.currency] || '$';

    if (!currentInvoice.items || currentInvoice.items.length === 0) {
      currentInvoice.items = [{
        id: 'item-' + Date.now(),
        title: 'Professional Service',
        subtext: '',
        qty: 1,
        price: 100
      }];
    }

    currentInvoice.items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.dataset.itemId = item.id;

      const itemTotal = (item.qty * item.price).toFixed(2);

      row.innerHTML = `
        <div class="item-desc-col">
          <input type="text" class="item-title-input" value="${escapeHtml(item.title)}" placeholder="Service / Item name..." required>
          <input type="text" class="item-subtext-input" value="${escapeHtml(item.subtext || '')}" placeholder="Optional details / scope...">
        </div>
        <input type="number" class="item-qty-input" value="${item.qty}" min="0.01" step="any" placeholder="1">
        <input type="number" class="item-price-input" value="${item.price}" min="0" step="any" placeholder="0.00">
        <div class="item-amount-display">${symbol}${formatNumber(itemTotal)}</div>
        <button type="button" class="btn-remove-row" title="Delete row">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      `;

      // Row event listeners for real-time calculation
      const titleInput = row.querySelector('.item-title-input');
      const subtextInput = row.querySelector('.item-subtext-input');
      const qtyInput = row.querySelector('.item-qty-input');
      const priceInput = row.querySelector('.item-price-input');
      const amountDisplay = row.querySelector('.item-amount-display');
      const btnRemove = row.querySelector('.btn-remove-row');

      const handleRowChange = () => {
        const q = parseFloat(qtyInput.value) || 0;
        const p = parseFloat(priceInput.value) || 0;
        const total = (q * p).toFixed(2);
        amountDisplay.textContent = `${CURRENCY_MAP[currentInvoice.currency] || '$'}${formatNumber(total)}`;
        readFormIntoState();
        updateLiveDocument();
      };

      titleInput.addEventListener('input', handleRowChange);
      subtextInput.addEventListener('input', handleRowChange);
      qtyInput.addEventListener('input', handleRowChange);
      priceInput.addEventListener('input', handleRowChange);

      btnRemove.addEventListener('click', () => {
        if (dom.itemsTableBody.querySelectorAll('.item-row').length <= 1) {
          showToast('Invoice must have at least one line item', 'info');
          return;
        }
        row.remove();
        readFormIntoState();
        updateLiveDocument();
      });

      dom.itemsTableBody.appendChild(row);
    });
  }

  function addNewLineItem(preset = null) {
    const newItem = preset ? {
      id: 'item-' + Date.now(),
      title: preset.title,
      subtext: preset.subtext,
      qty: preset.qty,
      price: preset.price
    } : {
      id: 'item-' + Date.now(),
      title: '',
      subtext: '',
      qty: 1,
      price: 0
    };

    currentInvoice.items.push(newItem);
    renderItemsFormRows();
    readFormIntoState();
    updateLiveDocument();

    // Focus newly added title input
    const rows = dom.itemsTableBody.querySelectorAll('.item-row');
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      const titleInput = lastRow.querySelector('.item-title-input');
      if (titleInput) titleInput.focus();
    }
  }

  // =========================================================================
  // Live Document Rendering & Math Calculations
  // =========================================================================
  function updateLiveDocument() {
    const symbol = CURRENCY_MAP[currentInvoice.currency] || '$';

    // 1. Header & Meta
    dom.docInvNumber.textContent = currentInvoice.number || 'INV-001';
    
    if (currentInvoice.poNumber) {
      dom.docPoRow.style.display = 'flex';
      dom.docPoNumber.textContent = currentInvoice.poNumber;
    } else {
      dom.docPoRow.style.display = 'none';
    }

    dom.docDate.textContent = formatDate(currentInvoice.date);
    dom.docDueDate.textContent = formatDate(currentInvoice.dueDate);

    // Status pill
    const status = currentInvoice.status || 'PENDING';
    dom.docStatusPill.className = `inv-status-pill status-${status.toLowerCase()}`;
    dom.docStatusPill.textContent = formatStatusLabel(status);

    // Currency code
    dom.docCurrencyCode.textContent = currentInvoice.currency || 'USD';

    // 2. Sender Details
    const s = currentInvoice.sender || {};
    dom.docSenderName.textContent = s.name || 'Your Business Name';
    
    // Address lines
    const senderAddrParts = [s.address, [s.city, s.state].filter(Boolean).join(', '), s.country].filter(Boolean);
    dom.docSenderAddress.innerHTML = senderAddrParts.join('<br>') || 'Street Address, City, Country';

    // Contact line
    const senderContacts = [s.email, s.phone].filter(Boolean);
    dom.docSenderContact.innerHTML = senderContacts.join(' &bull; ') || 'contact@example.com';
    dom.docFooterEmail.textContent = s.email || 'billing@example.com';

    // Tax ID
    if (s.taxId) {
      dom.docSenderTaxWrap.style.display = 'block';
      dom.docSenderTax.textContent = s.taxId;
    } else {
      dom.docSenderTaxWrap.style.display = 'none';
    }

    // Logo
    renderLogoOnDocument(s.logo, s.name);

    // 3. Client Details
    const c = currentInvoice.client || {};
    dom.docClientCompany.textContent = c.company || 'Client Company Name';
    
    if (c.contact) {
      dom.docClientContact.style.display = 'block';
      dom.docClientContact.textContent = c.contact;
    } else {
      dom.docClientContact.style.display = 'none';
    }

    const clientAddrParts = [c.address, [c.city, c.state].filter(Boolean).join(', '), c.country].filter(Boolean);
    dom.docClientAddress.innerHTML = clientAddrParts.join('<br>') || 'Billing Address, City, Country';

    if (c.email) {
      dom.docClientEmail.textContent = c.email;
      dom.docClientEmail.parentElement.style.display = 'block';
    } else {
      dom.docClientEmail.parentElement.style.display = 'none';
    }

    if (c.phone) {
      dom.docClientPhone.textContent = c.phone;
      dom.docClientPhone.parentElement.style.display = 'block';
    } else {
      dom.docClientPhone.parentElement.style.display = 'none';
    }

    if (c.taxId) {
      dom.docClientTaxWrap.style.display = 'block';
      dom.docClientTax.textContent = c.taxId;
    } else {
      dom.docClientTaxWrap.style.display = 'none';
    }

    // Terms preview
    const daysDiff = calculateDaysDifference(currentInvoice.date, currentInvoice.dueDate);
    dom.docTermsPreview.textContent = daysDiff >= 0 ? `Net ${daysDiff} Days` : 'Due on receipt';

    // 4. Line Items Table Rendering
    dom.docItemsTbody.innerHTML = '';
    let subtotal = 0;

    (currentInvoice.items || []).forEach((item, index) => {
      const q = parseFloat(item.qty) || 0;
      const p = parseFloat(item.price) || 0;
      const rowTotal = q * p;
      subtotal += rowTotal;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="td-num">${index + 1}</td>
        <td class="td-desc">
          <div class="td-item-title">${escapeHtml(item.title || 'Service Item')}</div>
          ${item.subtext ? `<div class="td-item-subtext">${escapeHtml(item.subtext)}</div>` : ''}
        </td>
        <td class="td-qty">${q}</td>
        <td class="td-rate">${symbol}${formatNumber(p.toFixed(2))}</td>
        <td class="td-total">${symbol}${formatNumber(rowTotal.toFixed(2))}</td>
      `;
      dom.docItemsTbody.appendChild(tr);
    });

    // 5. Calculations
    // Discount
    let discountAmount = 0;
    const discountVal = currentInvoice.discount?.value || 0;
    const discountType = currentInvoice.discount?.type || 'percent';

    if (discountType === 'percent') {
      discountAmount = (subtotal * (discountVal / 100));
      dom.docDiscountRateText.textContent = `(${discountVal}%)`;
    } else {
      discountAmount = Math.min(discountVal, subtotal);
      dom.docDiscountRateText.textContent = `(${symbol}${discountVal})`;
    }

    if (discountAmount > 0) {
      dom.docDiscountRow.style.display = 'flex';
      dom.docDiscount.textContent = `-${symbol}${formatNumber(discountAmount.toFixed(2))}`;
    } else {
      dom.docDiscountRow.style.display = 'none';
    }

    // Tax
    const taxableSubtotal = Math.max(0, subtotal - discountAmount);
    const taxRate = currentInvoice.tax?.rate || 0;
    const taxLabel = currentInvoice.tax?.label || 'Tax';
    const taxAmount = taxableSubtotal * (taxRate / 100);

    dom.docTaxLabel.textContent = taxLabel;
    dom.docTaxRate.textContent = `${taxRate}%`;
    dom.docTax.textContent = `${symbol}${formatNumber(taxAmount.toFixed(2))}`;

    if (taxRate > 0) {
      dom.docTaxRow.style.display = 'flex';
    } else {
      dom.docTaxRow.style.display = 'none';
    }

    // Shipping
    const shipping = currentInvoice.shipping || 0;
    if (shipping > 0) {
      dom.docShippingRow.style.display = 'flex';
      dom.docShipping.textContent = `${symbol}${formatNumber(shipping.toFixed(2))}`;
    } else {
      dom.docShippingRow.style.display = 'none';
    }

    // Grand Total
    const grandTotal = taxableSubtotal + taxAmount + shipping;
    const paid = currentInvoice.paid || 0;
    const balanceDue = Math.max(0, grandTotal - paid);

    // Update Totals Elements
    dom.docSubtotal.textContent = `${symbol}${formatNumber(subtotal.toFixed(2))}`;
    dom.docGrandTotal.textContent = `${symbol}${formatNumber(grandTotal.toFixed(2))}`;
    dom.docHeaderTotal.textContent = `${symbol}${formatNumber(balanceDue.toFixed(2))}`;

    if (paid > 0) {
      dom.docPaidRow.style.display = 'flex';
      dom.docPaid.textContent = `-${symbol}${formatNumber(paid.toFixed(2))}`;
      dom.docBalanceDueRow.style.display = 'flex';
      dom.docBalanceDue.textContent = `${symbol}${formatNumber(balanceDue.toFixed(2))}`;
    } else {
      dom.docPaidRow.style.display = 'none';
      dom.docBalanceDueRow.style.display = 'none';
    }

    // 6. Bank Details Box
    const p = currentInvoice.payment || {};
    let hasBank = false;
    if (p.bankName) {
      dom.docBankNameRow.style.display = 'flex';
      dom.docBankName.textContent = p.bankName;
      hasBank = true;
    } else {
      dom.docBankNameRow.style.display = 'none';
    }

    if (p.account) {
      dom.docBankAccountRow.style.display = 'flex';
      dom.docBankAccount.textContent = p.account;
      hasBank = true;
    } else {
      dom.docBankAccountRow.style.display = 'none';
    }

    if (p.routing) {
      dom.docBankRoutingRow.style.display = 'flex';
      dom.docBankRouting.textContent = p.routing;
      hasBank = true;
    } else {
      dom.docBankRoutingRow.style.display = 'none';
    }

    if (p.note) {
      dom.docPaymentNoteRow.style.display = 'flex';
      dom.docPaymentNote.textContent = p.note;
      hasBank = true;
    } else {
      dom.docPaymentNoteRow.style.display = 'none';
    }

    dom.docBankingBox.style.display = hasBank ? 'block' : 'none';

    // 7. Notes & Terms
    if (currentInvoice.notes) {
      dom.docNoteBox.style.display = 'block';
      dom.docClientNoteText.textContent = currentInvoice.notes;
    } else {
      dom.docNoteBox.style.display = 'none';
    }

    if (currentInvoice.terms) {
      dom.docTermsBox.style.display = 'block';
      dom.docTermsText.textContent = currentInvoice.terms;
    } else {
      dom.docTermsBox.style.display = 'none';
    }

    // 8. Signatory Block
    const sig = currentInvoice.signature || {};
    dom.docSignatureHandwritten.textContent = sig.name || 'Alex Morgan';
    dom.docSigName.textContent = sig.name || 'Alex Morgan';
    dom.docSigTitle.textContent = sig.title || 'Authorized Signatory';
  }

  // =========================================================================
  // Logo & Template Helpers
  // =========================================================================
  function renderLogoPreview(dataUrl) {
    if (dataUrl) {
      dom.logoPreviewImg.src = dataUrl;
      dom.logoPreviewWrapper.style.display = 'inline-flex';
      dom.logoPlaceholder.style.display = 'none';
    } else {
      dom.logoPreviewImg.src = '';
      dom.logoPreviewWrapper.style.display = 'none';
      dom.logoPlaceholder.style.display = 'flex';
    }
  }

  function renderLogoOnDocument(dataUrl, businessName) {
    if (dataUrl) {
      dom.docLogoImg.src = dataUrl;
      dom.docLogoImg.style.display = 'block';
      dom.docLogoFallback.style.display = 'none';
    } else {
      dom.docLogoImg.src = '';
      dom.docLogoImg.style.display = 'none';
      dom.docLogoFallback.style.display = 'flex';
      // Compute 2 letter initials
      const initials = (businessName || 'AS')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');
      dom.docLogoFallback.querySelector('span').textContent = initials || 'IN';
    }
  }

  function applyTemplateClass(templateKey) {
    dom.invoicePaper.classList.remove(
      'template-modern-royal',
      'template-minimal-azure',
      'template-executive-navy',
      'template-tech-cobalt'
    );
    dom.invoicePaper.classList.add(`template-${templateKey}`);
  }

  function updateCurrencySymbols() {
    const symbol = CURRENCY_MAP[dom.invCurrency.value] || '$';
    dom.shippingCurrencyPrefix.textContent = symbol;
    dom.paidCurrencyPrefix.textContent = symbol;
  }

  // =========================================================================
  // Save, Storage & History Management
  // =========================================================================
  function saveCurrentInvoice() {
    readFormIntoState();

    if (!currentInvoice.number) {
      showToast('Please enter an Invoice Number', 'error');
      dom.invNumber.focus();
      return;
    }

    if (!currentInvoice.client?.company) {
      showToast('Please enter a Client Business Name', 'error');
      dom.clientCompany.focus();
      return;
    }

    // Calculate total for index card display
    let subtotal = 0;
    (currentInvoice.items || []).forEach(it => {
      subtotal += (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0);
    });
    const discountVal = currentInvoice.discount?.value || 0;
    const discountAmount = currentInvoice.discount?.type === 'percent'
      ? (subtotal * (discountVal / 100))
      : Math.min(discountVal, subtotal);
    const taxable = Math.max(0, subtotal - discountAmount);
    const tax = taxable * ((currentInvoice.tax?.rate || 0) / 100);
    const grandTotal = taxable + tax + (currentInvoice.shipping || 0);

    const savedRecord = {
      ...JSON.parse(JSON.stringify(currentInvoice)),
      computedTotal: grandTotal,
      savedAt: new Date().toISOString()
    };

    // Check if invoice number already exists in saved list
    const existingIndex = savedInvoices.findIndex(inv => inv.number === currentInvoice.number);
    if (existingIndex >= 0) {
      savedInvoices[existingIndex] = savedRecord;
      showToast(`Updated invoice #${currentInvoice.number}`, 'success');
    } else {
      savedInvoices.unshift(savedRecord);
      showToast(`Saved invoice #${currentInvoice.number}`, 'success');
    }

    persistSavedInvoices();
    updateSavedCountBadge();
  }

  function loadSavedInvoicesFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_INVOICES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function persistSavedInvoices() {
    localStorage.setItem(STORAGE_KEYS.SAVED_INVOICES, JSON.stringify(savedInvoices));
  }

  function saveDraft() {
    localStorage.setItem(STORAGE_KEYS.AUTOSAVE_DRAFT, JSON.stringify(currentInvoice));
  }

  function updateSavedCountBadge() {
    dom.savedCountBadge.textContent = savedInvoices.length;
  }

  function openSavedInvoice(number) {
    const inv = savedInvoices.find(item => item.number === number);
    if (!inv) return;

    currentInvoice = JSON.parse(JSON.stringify(inv));
    populateFormFromState();
    renderItemsFormRows();
    updateLiveDocument();
    closeSavedDrawer();
    showToast(`Loaded invoice #${number}`, 'info');
  }

  function duplicateSavedInvoice(number) {
    const inv = savedInvoices.find(item => item.number === number);
    if (!inv) return;

    const copy = JSON.parse(JSON.stringify(inv));
    // Generate next invoice number
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    copy.number = `INV-2026-${randomSuffix}`;
    copy.date = new Date().toISOString().split('T')[0];
    copy.dueDate = getRelativeDate(15);
    copy.status = 'DRAFT';

    currentInvoice = copy;
    populateFormFromState();
    renderItemsFormRows();
    updateLiveDocument();
    closeSavedDrawer();
    showToast(`Duplicated as new invoice #${copy.number}`, 'success');
  }

  function deleteSavedInvoice(number) {
    if (!confirm(`Are you sure you want to delete invoice #${number}?`)) return;

    savedInvoices = savedInvoices.filter(item => item.number !== number);
    persistSavedInvoices();
    updateSavedCountBadge();
    renderSavedDrawerList();
    showToast(`Deleted invoice #${number}`, 'info');
  }

  // =========================================================================
  // Saved Invoices Drawer Rendering
  // =========================================================================
  function openSavedDrawer() {
    renderSavedDrawerList();
    dom.savedDrawerOverlay.classList.add('active');
    dom.savedDrawer.classList.add('active');
  }

  function closeSavedDrawer() {
    dom.savedDrawerOverlay.classList.remove('active');
    dom.savedDrawer.classList.remove('active');
  }

  function renderSavedDrawerList() {
    const query = dom.savedSearchInput.value.toLowerCase().trim();
    const activeFilter = document.querySelector('.filter-chip.active')?.dataset.filter || 'ALL';

    const filtered = savedInvoices.filter(inv => {
      // Filter tab
      if (activeFilter !== 'ALL' && inv.status !== activeFilter) return false;
      // Search
      if (query) {
        const numMatch = (inv.number || '').toLowerCase().includes(query);
        const clientMatch = (inv.client?.company || '').toLowerCase().includes(query);
        const contactMatch = (inv.client?.contact || '').toLowerCase().includes(query);
        if (!numMatch && !clientMatch && !contactMatch) return false;
      }
      return true;
    });

    dom.savedInvoicesList.innerHTML = '';

    if (filtered.length === 0) {
      dom.savedInvoicesList.innerHTML = `
        <div class="saved-empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline></svg>
          <p>No saved invoices match your search.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(inv => {
      const card = document.createElement('div');
      card.className = 'saved-invoice-card';
      const symbol = CURRENCY_MAP[inv.currency] || '$';
      const status = inv.status || 'PENDING';
      const totalFormatted = formatNumber((inv.computedTotal || 0).toFixed(2));

      card.innerHTML = `
        <div class="saved-card-top">
          <span class="saved-inv-num">#${escapeHtml(inv.number)}</span>
          <span class="inv-status-pill status-${status.toLowerCase()}">${formatStatusLabel(status)}</span>
        </div>
        <div class="saved-card-mid">
          <div>
            <div class="saved-client-name">${escapeHtml(inv.client?.company || 'Untitled Client')}</div>
            <div class="saved-date">Due: ${formatDate(inv.dueDate)}</div>
          </div>
          <div class="saved-amount">${symbol}${totalFormatted}</div>
        </div>
        <div class="saved-card-actions">
          <button type="button" class="btn btn-xs btn-outline btn-load" title="Open and edit">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            Edit
          </button>
          <button type="button" class="btn btn-xs btn-ghost btn-duplicate" title="Duplicate invoice">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copy
          </button>
          <button type="button" class="btn btn-xs btn-ghost btn-delete" title="Delete record" style="color: #EF4444;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>
          </button>
        </div>
      `;

      card.querySelector('.btn-load').addEventListener('click', (e) => {
        e.stopPropagation();
        openSavedInvoice(inv.number);
      });

      card.querySelector('.btn-duplicate').addEventListener('click', (e) => {
        e.stopPropagation();
        duplicateSavedInvoice(inv.number);
      });

      card.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSavedInvoice(inv.number);
      });

      card.addEventListener('click', () => {
        openSavedInvoice(inv.number);
      });

      dom.savedInvoicesList.appendChild(card);
    });
  }

  // =========================================================================
  // Zoom & View Controls
  // =========================================================================
  function setZoom(scale) {
    currentZoom = Math.min(Math.max(scale, 0.4), 1.6);
    dom.invoicePaper.style.transform = `scale(${currentZoom})`;
    dom.zoomLevelText.textContent = `${Math.round(currentZoom * 100)}%`;
  }

  function fitToScreen() {
    const containerWidth = dom.previewCanvasWrapper.clientWidth - 48;
    const paperWidth = 794;
    const fitScale = Math.min(1, Math.max(0.45, containerWidth / paperWidth));
    setZoom(fitScale);
  }

  // =========================================================================
  // Event Listeners Binding
  // =========================================================================
  function bindEvents() {
    // 1. Template Picker
    dom.templateLabels.forEach(label => {
      label.addEventListener('click', () => {
        dom.templateLabels.forEach(l => l.classList.remove('active'));
        label.classList.add('active');
        const template = label.dataset.template;
        currentInvoice.template = template;
        applyTemplateClass(template);
        saveDraft();
      });
    });

    // 2. Real-time Input Listeners across all form cards
    const inputs = document.querySelectorAll(
      '.editor-pane input:not(#logoFileInput), .editor-pane select, .editor-pane textarea'
    );
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        readFormIntoState();
        updateLiveDocument();
      });
      input.addEventListener('change', () => {
        readFormIntoState();
        updateLiveDocument();
      });
    });

    // Currency Switcher
    dom.invCurrency.addEventListener('change', () => {
      updateCurrencySymbols();
      renderItemsFormRows();
      readFormIntoState();
      updateLiveDocument();
    });

    // Due Date Preset Buttons
    dom.duePillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.duePillBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const days = parseInt(btn.dataset.days, 10);
        const baseDate = dom.invDate.value ? new Date(dom.invDate.value) : new Date();
        baseDate.setDate(baseDate.getDate() + days);
        dom.invDueDate.value = baseDate.toISOString().split('T')[0];
        readFormIntoState();
        updateLiveDocument();
      });
    });

    // 3. Logo Upload Handling
    dom.logoDropZone.addEventListener('click', (e) => {
      if (e.target.closest('#btnRemoveLogo')) return;
      dom.logoFileInput.click();
    });

    dom.logoFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        showToast('Image file size should be under 2MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        currentInvoice.sender.logo = dataUrl;
        renderLogoPreview(dataUrl);
        renderLogoOnDocument(dataUrl, currentInvoice.sender.name);
        saveDraft();
        showToast('Logo uploaded successfully', 'success');
      };
      reader.readAsDataURL(file);
    });

    dom.btnRemoveLogo.addEventListener('click', (e) => {
      e.stopPropagation();
      currentInvoice.sender.logo = '';
      dom.logoFileInput.value = '';
      renderLogoPreview('');
      renderLogoOnDocument('', currentInvoice.sender.name);
      saveDraft();
      showToast('Logo removed', 'info');
    });

    // 4. Line Items Actions
    dom.btnAddItem.addEventListener('click', () => addNewLineItem());

    dom.quickServiceSelect.addEventListener('change', () => {
      const val = dom.quickServiceSelect.value;
      if (val && SERVICE_PRESETS[val]) {
        addNewLineItem(SERVICE_PRESETS[val]);
        dom.quickServiceSelect.value = '';
        showToast('Preset service added', 'success');
      }
    });

    // 5. Remember Business Details as Default
    dom.btnSaveDefaultBusiness.addEventListener('click', () => {
      readFormIntoState();
      localStorage.setItem(STORAGE_KEYS.DEFAULT_SENDER, JSON.stringify(currentInvoice.sender));
      showToast('Your business details saved as default sender!', 'success');
    });

    // 6. Header Buttons: Save, Print, Download, New, Sample
    dom.btnSave.addEventListener('click', saveCurrentInvoice);

    dom.btnPrint.addEventListener('click', () => {
      PDFExportService.printInvoice();
    });

    dom.btnDownloadPDF.addEventListener('click', async () => {
      readFormIntoState();
      const originalText = dom.btnDownloadPDF.innerHTML;
      
      await PDFExportService.downloadInvoicePDF(
        dom.invoicePaper,
        {
          number: currentInvoice.number,
          client: currentInvoice.client?.company
        },
        (loading, msg) => {
          if (loading) {
            dom.btnDownloadPDF.disabled = true;
            dom.btnDownloadPDF.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
              <span>Generating...</span>
            `;
            showToast('Generating high-resolution PDF...', 'info');
          } else {
            dom.btnDownloadPDF.disabled = false;
            dom.btnDownloadPDF.innerHTML = originalText;
            showToast(msg || 'PDF Downloaded!', 'success');
          }
        }
      );
    });

    dom.btnNew.addEventListener('click', () => {
      if (confirm('Start a fresh new invoice? Any unsaved edits will be cleared.')) {
        startFreshInvoice();
      }
    });

    dom.btnLoadSample.addEventListener('click', () => {
      currentInvoice = JSON.parse(JSON.stringify(SAMPLE_INVOICE));
      populateFormFromState();
      renderItemsFormRows();
      updateLiveDocument();
      saveDraft();
      showToast('Loaded demo sample invoice', 'info');
    });

    // 7. Drawer Open / Close & Search / Filter
    dom.btnOpenSaved.addEventListener('click', openSavedDrawer);
    dom.btnCloseDrawer.addEventListener('click', closeSavedDrawer);
    dom.savedDrawerOverlay.addEventListener('click', closeSavedDrawer);

    dom.savedSearchInput.addEventListener('input', renderSavedDrawerList);

    dom.savedFilterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        dom.savedFilterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderSavedDrawerList();
      });
    });

    // Backup Export & Import
    dom.btnExportAllData.addEventListener('click', exportBackupJSON);
    dom.importBackupInput.addEventListener('change', importBackupJSON);

    // 8. Zoom Controls
    dom.btnZoomIn.addEventListener('click', () => setZoom(currentZoom + 0.1));
    dom.btnZoomOut.addEventListener('click', () => setZoom(currentZoom - 0.1));
    dom.btnZoomReset.addEventListener('click', fitToScreen);
    dom.btnToggleBg.addEventListener('click', () => {
      dom.previewCanvasWrapper.classList.toggle('dark-backdrop');
    });

    // 9. Mobile Responsive View Switcher
    dom.btnViewEditor.addEventListener('click', () => {
      dom.btnViewEditor.classList.add('active');
      dom.btnViewPreview.classList.remove('active');
      dom.workspace.classList.remove('mode-preview');
    });

    dom.btnViewPreview.addEventListener('click', () => {
      dom.btnViewPreview.classList.add('active');
      dom.btnViewEditor.classList.remove('active');
      dom.workspace.classList.add('mode-preview');
      fitToScreen();
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 1080) {
        fitToScreen();
      }
    });
  }

  // =========================================================================
  // Auxiliary Utility Functions
  // =========================================================================
  function startFreshInvoice() {
    // Generate new invoice number
    const nextNum = 'INV-' + new Date().getFullYear() + '-' + String(savedInvoices.length + 1).padStart(3, '0');
    
    // Retrieve default sender if available
    let sender = {
      name: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      website: '',
      logo: ''
    };
    const savedSender = localStorage.getItem(STORAGE_KEYS.DEFAULT_SENDER);
    if (savedSender) {
      try { sender = JSON.parse(savedSender); } catch (e) {}
    }

    currentInvoice = {
      id: 'inv-' + Date.now(),
      template: 'modern-royal',
      number: nextNum,
      poNumber: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: getRelativeDate(15),
      status: 'PENDING',
      currency: 'USD',
      sender,
      client: {
        company: '',
        contact: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        taxId: ''
      },
      items: [
        {
          id: 'item-1',
          title: 'Consulting / Service',
          subtext: 'Description of delivered work',
          qty: 1,
          price: 500
        }
      ],
      tax: { rate: 10, label: 'Sales Tax' },
      discount: { value: 0, type: 'percent' },
      shipping: 0,
      paid: 0,
      payment: {
        bankName: '',
        account: '',
        routing: '',
        note: ''
      },
      notes: 'Thank you for your business!',
      terms: 'Payment due within 15 days of invoice date.',
      signature: {
        name: sender.name ? sender.name.split(' ')[0] : 'Authorized Representative',
        title: 'Director'
      }
    };

    populateFormFromState();
    renderItemsFormRows();
    updateLiveDocument();
    saveDraft();
    showToast('New blank invoice initialized', 'info');
  }

  function exportBackupJSON() {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      savedInvoices,
      currentInvoice
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoicely_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Invoices backup exported successfully', 'success');
  }

  function importBackupJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported.savedInvoices)) {
          savedInvoices = imported.savedInvoices;
          persistSavedInvoices();
          updateSavedCountBadge();
          renderSavedDrawerList();
          showToast(`Imported ${savedInvoices.length} invoices successfully!`, 'success');
        } else {
          showToast('Invalid backup file structure', 'error');
        }
      } catch (err) {
        showToast('Failed to parse backup JSON', 'error');
      }
    };
    reader.readAsText(file);
    dom.importBackupInput.value = '';
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `${iconSvg} <span>${escapeHtml(message)}</span>`;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 3200);
  }

  function formatNumber(numStr) {
    const n = parseFloat(numStr);
    if (isNaN(n)) return '0.00';
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  }

  function getRelativeDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  function calculateDaysDifference(date1Str, date2Str) {
    try {
      const d1 = new Date(date1Str);
      const d2 = new Date(date2Str);
      const diffTime = d2.getTime() - d1.getTime();
      return Math.round(diffTime / (1000 * 3600 * 24));
    } catch (e) {
      return 15;
    }
  }

  function formatStatusLabel(status) {
    switch (status) {
      case 'PAID': return 'Paid in Full';
      case 'PENDING': return 'Pending Payment';
      case 'OVERDUE': return 'Payment Overdue';
      case 'DRAFT': return 'Draft Invoice';
      default: return status;
    }
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
