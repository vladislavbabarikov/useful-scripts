(async () => {
  const wait = (ms) => new Promise(res => setTimeout(res, ms));

  // ===== настройка: индекс наценки =====
  const INDEX_PERCENT = 1.0053; // +0.53%
  // =====================================

  const EDIT_BTN_SELECTOR = '[data-testid="category-info-block-children"] [data-testid="menu-item-photo"] button';
  const PRICE_INPUT_SELECTOR = 'input[name="price"][data-testid="menu-position-price-input"]';
  const SAVE_BTN_SELECTOR = 'button[data-testid="menu-position-submit-btn"]';
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

  function setReactInputValue(input, value) {
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  async function typeLikeHuman(input, text) {
    input.focus();
    input.select();
    input.dispatchEvent(new InputEvent('beforeinput', {
      inputType: 'deleteContentBackward', data: null, bubbles: true, cancelable: true
    }));
    setReactInputValue(input, '');
    await wait(60);

    let acc = '';
    
    for (const ch of String(text)) {
      input.dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'insertText', data: ch, bubbles: true, cancelable: true
      }));
      acc += ch;
      setReactInputValue(input, acc);
      input.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { key: ch, bubbles: true }));
      await wait(30);
    }
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.blur();
    await wait(120);
  }

  function clickLeftArea() {
    const x = 10;
    const y = Math.floor(window.innerHeight / 2);
    const target = document.elementFromPoint(x, y);
    if (!target) return false;
    const opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
    target.dispatchEvent(new MouseEvent('pointerdown', opts));
    target.dispatchEvent(new MouseEvent('mousedown', opts));
    target.dispatchEvent(new MouseEvent('pointerup', opts));
    target.dispatchEvent(new MouseEvent('mouseup', opts));
    target.dispatchEvent(new MouseEvent('click', opts));
    return true;
  }

  let editButtons = [];
  for (let i = 0; i < 40; i++) {
    editButtons = Array.from(document.querySelectorAll(EDIT_BTN_SELECTOR));
    if (editButtons.length) break;
    await wait(250);
  }
  if (!editButtons.length) {
    console.warn('❌ Edit buttons not found. Проверь, что Console в Top frame и список товаров виден (не виртуализирован за экраном).');
    return;
  }
  console.log(`🔍 Products found: ${editButtons.length}`);

  for (let i = 0; i < editButtons.length; i++) {
    console.group(`✏️ Product ${i + 1}/${editButtons.length}`);
    try {
      editButtons[i].click();
      await wait(900);

      let priceInput = null;
      for (let t = 0; t < 40; t++) {
        priceInput = document.querySelector(PRICE_INPUT_SELECTOR);
        if (priceInput) break;
        await wait(150);
      }
      if (!priceInput) {
        console.warn('⚠️ Price input not found — skip');
        if (!clickLeftArea()) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await wait(400);
        console.groupEnd();
        continue;
      }

      const oldPrice = parseInt((priceInput.value || '').replace(/\D/g, ''), 10);
      if (!Number.isFinite(oldPrice)) {
        console.warn('⚠️ Can’t parse old price — skip');
        if (!clickLeftArea()) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await wait(400);
        console.groupEnd();
        continue;
      }
      const newPrice = Math.ceil(oldPrice * INDEX_PERCENT);
      console.log(`➡️ ${oldPrice} → ${newPrice}`);

      await typeLikeHuman(priceInput, String(newPrice));

      let saveBtn = null;
      for (let t = 0; t < 40; t++) {
        const btn = document.querySelector(SAVE_BTN_SELECTOR);
        if (btn && !btn.disabled) { saveBtn = btn; break; }
        await wait(150);
      }

      if (saveBtn) {
        saveBtn.click();
        console.log('✅ Saved (button)');
      } else {
        const form = priceInput.closest('form');
        if (form && form.requestSubmit) {
          form.requestSubmit();
          console.log('✅ Saved (form.requestSubmit fallback)');
        } else {
          console.warn('⚠️ Apply button didn’t activate, and no form to submit');
        }
      }

      await wait(600);

      if (clickLeftArea()) {
        console.log('↩️ Closed card (left click)');
      } else {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        console.log('↩️ Closed card (Escape fallback)');
      }
      await wait(500);
    } catch (e) {
      console.error('❌ Error:', e);
      if (!clickLeftArea()) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await wait(400);
    } finally {
      console.groupEnd();
    }
  }

  console.log('🏁 Script completed');
})().then(() => console.log('✅ DONE')).catch(e => console.error(e));
