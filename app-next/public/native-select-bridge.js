(function () {
  var BRIDGE_ATTR = "data-native-select-bridge";
  var BUTTON_ATTR = "data-custom-select-bridge";

  function syncButtonLabel(select, button) {
    var selected = select.selectedOptions && select.selectedOptions[0];
    var label = (selected && selected.textContent && selected.textContent.trim()) || select.getAttribute("aria-label") || "Selecione";
    var labelNode = button.querySelector("[data-select-label]");
    if (labelNode) labelNode.textContent = label;
    button.toggleAttribute("disabled", select.disabled);
    button.setAttribute("aria-disabled", String(select.disabled));
    button.setAttribute("aria-label", select.getAttribute("aria-label") || label);
  }

  function closeDropdowns() {
    document.querySelectorAll("[data-custom-select-dropdown]").forEach(function (node) {
      node.remove();
    });
  }

  function notifyReactChange(select) {
    var propsKey = Object.keys(select).find(function (key) {
      return key.indexOf("__reactProps$") === 0;
    });
    var props = propsKey ? select[propsKey] : null;
    if (props && typeof props.onChange === "function") {
      props.onChange({
        bubbles: true,
        cancelable: false,
        currentTarget: select,
        defaultPrevented: false,
        isDefaultPrevented: function () { return false; },
        isPropagationStopped: function () { return false; },
        nativeEvent: new Event("change", { bubbles: true }),
        preventDefault: function () {},
        stopPropagation: function () {},
        target: select,
        type: "change"
      });
    }
  }

  function createDropdown(select, button) {
    closeDropdowns();

    var dropdown = document.createElement("div");
    dropdown.setAttribute("role", "listbox");
    dropdown.setAttribute("data-custom-select-dropdown", "true");
    dropdown.className = "fixed z-[9999] max-h-64 min-w-32 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-xl";

    var rect = button.getBoundingClientRect();
    dropdown.style.left = rect.left + "px";
    dropdown.style.top = rect.bottom + 6 + "px";
    dropdown.style.width = Math.max(rect.width, 128) + "px";

    Array.prototype.forEach.call(select.options, function (option) {
      var item = document.createElement("button");
      item.type = "button";
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(option.value === select.value));
      item.className = "flex w-full items-center justify-between rounded-sm px-3 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none";
      item.textContent = option.textContent || option.value;
      item.addEventListener("click", function () {
        var valueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
        if (valueSetter) {
          valueSetter.call(select, option.value);
        } else {
          select.value = option.value;
        }
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
        notifyReactChange(select);
        syncButtonLabel(select, button);
        closeDropdowns();
        button.focus();
      });
      dropdown.appendChild(item);
    });

    dropdown.addEventListener("keydown", function (event) {
      var items = Array.prototype.slice.call(dropdown.querySelectorAll("button"));
      var currentIndex = items.indexOf(document.activeElement);
      if (event.key === "Escape") {
        event.preventDefault();
        closeDropdowns();
        button.focus();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        (items[currentIndex + 1] || items[0]).focus();
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        (items[currentIndex - 1] || items[items.length - 1]).focus();
      }
    });

    document.body.appendChild(dropdown);
    requestAnimationFrame(function () {
      var active = dropdown.querySelector('[aria-selected="true"]');
      (active || dropdown.querySelector("button")).focus();
    });
  }

  function enhanceSelect(select) {
    if (select.hasAttribute(BRIDGE_ATTR)) return;

    select.setAttribute(BRIDGE_ATTR, "true");
    select.style.display = "none";

    var button = document.createElement("button");
    button.type = "button";
    button.setAttribute(BUTTON_ATTR, "true");
    button.setAttribute("aria-haspopup", "listbox");
    button.className = [
      select.className,
      "inline-flex items-center justify-between gap-2 text-left",
      "focus:outline-none focus:ring-1 focus:ring-ring",
      "disabled:pointer-events-none disabled:opacity-50"
    ].join(" ");

    var label = document.createElement("span");
    label.setAttribute("data-select-label", "true");
    label.className = "min-w-0 truncate";

    var icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.className = "shrink-0 opacity-60";
    icon.textContent = "v";

    button.append(label, icon);
    syncButtonLabel(select, button);

    button.addEventListener("click", function () {
      if (!select.disabled) createDropdown(select, button);
    });

    button.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        button.click();
      }
    });

    select.addEventListener("change", function () {
      syncButtonLabel(select, button);
    });

    new MutationObserver(function () {
      syncButtonLabel(select, button);
    }).observe(select, { attributes: true, childList: true, subtree: true });

    select.insertAdjacentElement("afterend", button);
  }

  function enhanceAll() {
    document.querySelectorAll("select").forEach(function (select) {
      enhanceSelect(select);
    });
  }

  document.addEventListener("mousedown", function (event) {
    var target = event.target;
    if (!target.closest("[data-custom-select-dropdown]") && !target.closest("[" + BUTTON_ATTR + "]")) {
      closeDropdowns();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceAll);
  } else {
    enhanceAll();
  }

  new MutationObserver(enhanceAll).observe(document.documentElement, { childList: true, subtree: true });
})();
