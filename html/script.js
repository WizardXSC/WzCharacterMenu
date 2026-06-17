let activeConfig = {};
let activeLocales = {};
let currentAppearance = {
    model: null,
    components: {},
    props: {},
    hairColor: 0,
    hairHighlightColor: 0,
    headBlend: {
        shapeFirst: 0, shapeSecond: 0, shapeThird: 0,
        skinFirst: 0, skinSecond: 0, skinThird: 0,
        shapeMix: 0.0, skinMix: 0.0, thirdMix: 0.0
    }
};
let savedCharacters = [];
let menuStack = [];

const componentNames = {
    "1": "Mask",
    "3": "Torso / Arms",
    "4": "Pants",
    "5": "Bag / Parachute",
    "6": "Shoes",
    "7": "Accessories / Neck",
    "8": "Undershirt",
    "9": "Body Armor",
    "10": "Decals",
    "11": "Jacket / Outerwear"
};

const propNames = {
    "0": "Hat / Helmet",
    "1": "Glasses",
    "2": "Ears",
    "6": "Watch",
    "7": "Bracelet"
};

function _U(str) {
    if (activeLocales && activeLocales[str]) {
        return activeLocales[str];
    }
    return str;
}

window.addEventListener('message', function (event) {
    const data = event.data;
    if (data.action === "open") {
        activeConfig = data.config;
        activeLocales = data.config.Locales[data.config.Locale] || {};
        currentAppearance = data.components;
        savedCharacters = data.saved || [];

        document.getElementById("title-text").innerText = _U("menu_title");
        document.getElementById("subtitle-text").innerText = _U("menu_subtitle");
        document.getElementById("footer-text").innerHTML = `Press <kbd class="keycap">SPACE</kbd> to rotate character 180°`;

        const savedX = localStorage.getItem('menu_x') || "5";
        const savedY = localStorage.getItem('menu_y') || "10";
        const menuContainer = document.getElementById("menu-container");
        if (menuContainer) {
            menuContainer.style.left = savedX + "%";
            menuContainer.style.top = savedY + "%";
        }

        document.getElementById("app").style.display = "block";

        menuStack = [];
        pushMenu({ type: "main" });
    } else if (data.action === "close") {
        document.getElementById("app").style.display = "none";
    } else if (data.action === "updateComponents") {
        currentAppearance = data.components;
        const currentMenu = menuStack[menuStack.length - 1];
        if (currentMenu && currentMenu.type === "appearance") {
            renderMenu(currentMenu);
        }
    }
});

let activeItemIndex = 0;

function updateSelectables() {
    activeItemIndex = 0;
    const selectables = document.querySelectorAll(".selectable");
    if (selectables.length > 0) {
        setActiveItem(0);
    }
}

function setActiveItem(index) {
    const selectables = document.querySelectorAll(".selectable");
    selectables.forEach((el, idx) => {
        if (idx === index) {
            el.classList.add("active");
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            el.classList.remove("active");
        }
    });
    activeItemIndex = index;
}

document.addEventListener('keydown', function (event) {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        if (event.key === "Escape" || event.key === "Tab") {
            activeEl.blur();
        }
        return;
    }

    const selectables = document.querySelectorAll(".selectable");
    if (selectables.length === 0) return;

    const active = selectables[activeItemIndex];
    const isInputBtn = active && active.classList.contains("input-btn");

    if (isInputBtn) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            return;
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            let parentContainerIdx = -1;
            for (let i = activeItemIndex - 1; i >= 0; i--) {
                if (selectables[i].classList.contains("input-container")) {
                    parentContainerIdx = i;
                    break;
                }
            }
            if (parentContainerIdx !== -1) {
                setActiveItem(parentContainerIdx);
            }
            return;
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            if (active.classList.contains("cancel")) {
                let confirmIdx = -1;
                for (let i = 0; i < selectables.length; i++) {
                    if (selectables[i].classList.contains("confirm") && selectables[i].classList.contains("input-btn")) {
                        confirmIdx = i;
                        break;
                    }
                }
                if (confirmIdx !== -1) {
                    setActiveItem(confirmIdx);
                }
            }
            return;
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            if (active.classList.contains("confirm")) {
                let cancelIdx = -1;
                for (let i = 0; i < selectables.length; i++) {
                    if (selectables[i].classList.contains("cancel") && selectables[i].classList.contains("input-btn")) {
                        cancelIdx = i;
                        break;
                    }
                }
                if (cancelIdx !== -1) {
                    setActiveItem(cancelIdx);
                }
            }
            return;
        }
    }

    if (event.key === "ArrowDown") {
        event.preventDefault();
        let next = activeItemIndex + 1;
        if (next >= selectables.length) next = 0;
        setActiveItem(next);
    } else if (event.key === "ArrowUp") {
        event.preventDefault();
        let prev = activeItemIndex - 1;
        if (prev < 0) prev = selectables.length - 1;
        setActiveItem(prev);
    } else if (event.key === "Enter") {
        event.preventDefault();
        if (active) {
            if (active.changeT) {
                active.changeT();
            } else if (active.tagName === "BUTTON") {
                active.click();
            } else if (active.classList.contains("input-container") || active.classList.contains("code-container")) {
                const inp = active.querySelector("input") || active.querySelector("textarea");
                if (inp) inp.focus();
            }
        }
    } else if (event.key === "Backspace") {
        event.preventDefault();
        popMenu();
    } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (active) {
            if (active.changeD) {
                active.changeD("left");
            } else if (active.classList.contains("slider-item")) {
                const leftBtn = active.querySelector(".slider-arrow.left-arrow");
                if (leftBtn) leftBtn.click();
            }
        }
    } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (active) {
            if (active.changeD) {
                active.changeD("right");
            } else if (active.classList.contains("slider-item")) {
                const rightBtn = active.querySelector(".slider-arrow.right-arrow");
                if (rightBtn) rightBtn.click();
            }
        }
    } else if (event.key === " ") {
        event.preventDefault();
        fetch(`https://${GetParentResourceName()}/rotatePed`, {
            method: 'POST',
            body: JSON.stringify({})
        });
    } else if (event.key === "m" || event.key === "M" || event.key === "Escape") {
        event.preventDefault();
        fetch(`https://${GetParentResourceName()}/close`, {
            method: 'POST',
            body: JSON.stringify({})
        });
    }
});

function pushMenu(menuState) {
    menuStack.push(menuState);
    renderMenu(menuState);
}

function popMenu() {
    if (menuStack.length > 1) {
        menuStack.pop();
        const prevMenu = menuStack[menuStack.length - 1];
        renderMenu(prevMenu);
    } else {
        fetch(`https://${GetParentResourceName()}/close`, {
            method: 'POST',
            body: JSON.stringify({})
        });
    }
}

function renderMenu(state) {
    const itemsContainer = document.getElementById("menu-items");
    itemsContainer.innerHTML = "";

    let camType = "body";
    if (state.type === "appearance_face" || state.type === "appearance_hair" || state.type === "appearance_props") {
        camType = "head";
    }

    fetch(`https://${GetParentResourceName()}/changeCamType`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: camType })
    });

    if (state.type === "main") {
        createMenuButton(_U("create_new"), () => {
            fetch(`https://${GetParentResourceName()}/changeModel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: activeConfig.FreemodePeds[0].model })
            }).then(resp => resp.json()).then(data => {
                if (data && data.components) {
                    currentAppearance = data.components;
                }
                pushMenu({ type: "appearance" });
            });
        });

        createMenuButton(_U("saved_chars"), () => {
            pushMenu({ type: "saved_list" });
        });

        createMenuButton(_U("appearance"), () => {
            pushMenu({ type: "appearance" });
        });

        createMenuButton(_U("import_char"), () => {
            pushMenu({ type: "import_prompt" });
        });

        createMenuButton(_U("receive_sharing"), () => {
            pushMenu({ type: "export_prompt" });
        });

        if (activeConfig.HasCustomPedAccess) {
            createMenuButton(_U("custom_peds"), () => {
                pushMenu({ type: "custom_peds_list" });
            });
        }

        createMenuButton(_U("settings"), () => {
            pushMenu({ type: "settings" });
        });

        createMenuButton("Exit Menu", () => {
            fetch(`https://${GetParentResourceName()}/close`, {
                method: 'POST',
                body: JSON.stringify({})
            });
        });

    } else if (state.type === "saved_list") {
        createMenuButton(`<i class="fa-solid fa-chevron-left"></i> ${_U("back_btn")}`, () => { popMenu(); });

        if (savedCharacters.length === 0) {
            const info = document.createElement("div");
            info.className = "menu-info-text";
            info.innerText = _U("no_saved_chars");
            itemsContainer.appendChild(info);
            return;
        }

        savedCharacters.forEach(charName => {
            createMenuButton(charName, () => {
                pushMenu({ type: "saved_actions", charName: charName });
            });
        });

    } else if (state.type === "saved_actions") {
        const charName = state.charName;

        createMenuButton(`<i class="fa-solid fa-chevron-left"></i> ${charName}`, () => { popMenu(); });

        createMenuButton(_U("apply_btn"), () => {
            fetch(`https://${GetParentResourceName()}/loadCharacter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: charName })
            }).then(resp => resp.json()).then(data => {
                if (data.status === "success") {
                    currentAppearance = data.components;
                }
            });
        });

        createMenuButton("Edit Character", () => {
            fetch(`https://${GetParentResourceName()}/loadCharacter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: charName })
            }).then(resp => resp.json()).then(data => {
                if (data.status === "success") {
                    currentAppearance = data.components;
                    pushMenu({ type: "appearance" });
                }
            });
        });

        createMenuButton(_U("share_btn"), () => {
            pushMenu({ type: "export_char_code", charName: charName });
        });

        createMenuButton(_U("delete_btn"), () => {
            fetch(`https://${GetParentResourceName()}/deleteCharacter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: charName })
            }).then(resp => resp.json()).then(data => {
                if (data.status === "success") {
                    savedCharacters = data.saved;
                    popMenu();
                }
            });
        });

    } else if (state.type === "export_char_code") {
        const charName = state.charName;
        createMenuButton(`<i class="fa-solid fa-chevron-left"></i> Back`, () => { popMenu(); });

        fetch(`https://${GetParentResourceName()}/loadCharacter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: charName })
        }).then(resp => resp.json()).then(data => {
            if (data && data.components) {
                currentAppearance = data.components;
            }
            const b64 = btoa(JSON.stringify(currentAppearance));

            const hint = document.createElement("div");
            hint.className = "menu-info-text";
            hint.style.padding = "10px 0";
            hint.style.marginBottom = "5px";
            hint.innerText = `Character: ${charName}`;
            itemsContainer.appendChild(hint);

            createMenuButton(`<i class="fa-solid fa-copy"></i> Copy Code`, () => {
                copyTextToClipboard(b64);
                statusText.innerText = "Code copied to clipboard!";
                statusText.style.color = "#4caf50";
            });

            const statusText = document.createElement("div");
            statusText.className = "menu-info-text";
            statusText.style.padding = "10px 0";
            statusText.innerText = "";
            itemsContainer.appendChild(statusText);

            updateSelectables();
        });

    } else if (state.type === "import_prompt") {
        createMenuButton(`<i class="fa-solid fa-chevron-left"></i> ${_U("back_btn")}`, () => { popMenu(); });

        const container = document.createElement("div");
        container.className = "input-container selectable";
        container.onmouseenter = () => {
            const selectables = document.querySelectorAll(".selectable");
            const idx = Array.from(selectables).indexOf(container);
            if (idx !== -1) setActiveItem(idx);
        };

        const textarea = document.createElement("textarea");
        textarea.className = "menu-input";
        textarea.placeholder = _U("import_code_placeholder");
        textarea.style.height = "80px";
        container.appendChild(textarea);

        const actions = document.createElement("div");
        actions.className = "input-actions";

        const btnConfirm = document.createElement("button");
        btnConfirm.className = "input-btn confirm selectable";
        btnConfirm.innerText = "Import";
        btnConfirm.onclick = () => {
            const b64 = textarea.value.trim();
            if (!b64) return;
            try {
                const parsed = JSON.parse(atob(b64));
                fetch(`https://${GetParentResourceName()}/importCharacter`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ appearance: parsed })
                }).then(resp => resp.json()).then(data => {
                    if (data.status === "success") {
                        currentAppearance = data.components;
                        popMenu();
                    } else {
                        alert(_U("import_invalid"));
                    }
                });
            } catch (e) {
                alert(_U("import_invalid"));
            }
        };
        btnConfirm.onmouseenter = () => {
            const selectables = document.querySelectorAll(".selectable");
            const idx = Array.from(selectables).indexOf(btnConfirm);
            if (idx !== -1) setActiveItem(idx);
        };

        const btnCancel = document.createElement("button");
        btnCancel.className = "input-btn cancel selectable";
        btnCancel.innerText = "Cancel";
        btnCancel.onclick = () => { popMenu(); };
        btnCancel.onmouseenter = () => {
            const selectables = document.querySelectorAll(".selectable");
            const idx = Array.from(selectables).indexOf(btnCancel);
            if (idx !== -1) setActiveItem(idx);
        };

        textarea.onkeydown = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                textarea.blur();
                btnConfirm.click();
            } else if (e.key === "ArrowDown" || e.key === "Tab") {
                e.preventDefault();
                textarea.blur();
                const selectables = document.querySelectorAll(".selectable");
                const currentIdx = Array.from(selectables).indexOf(container);
                if (currentIdx !== -1 && currentIdx + 1 < selectables.length) {
                    setActiveItem(currentIdx + 1);
                }
            }
        };

        actions.appendChild(btnConfirm);
        actions.appendChild(btnCancel);
        container.appendChild(actions);
        itemsContainer.appendChild(container);

    } else if (state.type === "export_prompt") {
        createMenuButton(`<i class="fa-solid fa-chevron-left"></i> ${_U("back_btn")}`, () => { popMenu(); });

        const b64 = btoa(JSON.stringify(currentAppearance));

        const hint = document.createElement("div");
        hint.className = "menu-info-text";
        hint.style.padding = "10px 0";
        hint.style.marginBottom = "5px";
        hint.innerText = "Copy your current appearance code:";
        itemsContainer.appendChild(hint);

        createMenuButton(`<i class="fa-solid fa-copy"></i> Copy Code`, () => {
            copyTextToClipboard(b64);
            statusText.innerText = "Code copied to clipboard!";
            statusText.style.color = "#4caf50";
        });

        const statusText = document.createElement("div");
        statusText.className = "menu-info-text";
        statusText.style.padding = "10px 0";
        statusText.innerText = "";
        itemsContainer.appendChild(statusText);

    } else if (state.type === "custom_peds_list") {
        if (!activeConfig.HasCustomPedAccess) {
            popMenu();
            return;
        }
        createMenuButton(`<i class="fa-solid fa-chevron-left"></i> ${_U("back_btn")}`, () => { popMenu(); });

        activeConfig.CustomPeds.forEach(pedData => {
            createMenuButton(pedData.label, () => {
                fetch(`https://${GetParentResourceName()}/changeModel`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: pedData.model })
                }).then(resp => resp.json()).then(data => {
                    if (data && data.components) {
                        currentAppearance = data.components;
                        pushMenu({ type: "appearance" });
                    }
                });
            });
        });

    } else if (state.type === "settings") {
        createMenuButton(`<i class="fa-solid fa-chevron-left"></i> ${_U("back_btn")}`, () => { popMenu(); });

        const currentX = localStorage.getItem('menu_x') || "5";
        const currentY = localStorage.getItem('menu_y') || "10";

        createMenuSlider("Menu X Position", 0, 90, parseInt(currentX), (val) => {
            const container = document.getElementById("menu-container");
            if (container) {
                container.style.left = val + "%";
            }
            localStorage.setItem('menu_x', val);
        }, (val) => `${val}%`, "settings-x-slider");

        createMenuSlider("Menu Y Position", 0, 85, parseInt(currentY), (val) => {
            const container = document.getElementById("menu-container");
            if (container) {
                container.style.top = val + "%";
            }
            localStorage.setItem('menu_y', val);
        }, (val) => `${val}%`, "settings-y-slider");

        createMenuButton("Reset Position", () => {
            const container = document.getElementById("menu-container");
            if (container) {
                container.style.left = "5%";
                container.style.top = "10%";
            }
            localStorage.setItem('menu_x', "5");
            localStorage.setItem('menu_y', "10");

            renderMenu(state);
        });

    } else if (state.type === "appearance") {
        createMenuButton(`<i class="fa-solid fa-chevron-left"></i> Main Menu`, () => { popMenu(); });

        createMenuButton("Ped Model Choice", () => {
            pushMenu({ type: "appearance_model" });
        });

        const currentModel = currentAppearance.model;
        const isFreemode = (currentModel === 1885233650 || currentModel === -1667301419);

        if (isFreemode) {
            createMenuButton("Face Blend & Skin", () => {
                pushMenu({ type: "appearance_face" });
            });
        }

        createMenuButton("Hair Style & Color", () => {
            pushMenu({ type: "appearance_hair" });
        });

        createMenuButton("Clothing Components", () => {
            pushMenu({ type: "appearance_clothing" });
        });

        createMenuButton("Props Accessories", () => {
            pushMenu({ type: "appearance_props" });
        });

        createMenuButton(`<i class="fa-solid fa-floppy-disk"></i> ${_U("save_btn")}`, () => {
            pushMenu({ type: "appearance_save" });
        });

    } else if (state.type === "appearance_model") {
        createMenuButton(`<i class="fa-solid fa-chevron-left"></i> ${_U("back_btn")}`, () => { popMenu(); });

        activeConfig.FreemodePeds.forEach(ped => {
            createMenuButton(ped.label, () => {
                fetch(`https://${GetParentResourceName()}/changeModel`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: ped.model })
                }).then(resp => resp.json()).then(data => {
                    if (data && data.components) {
                        currentAppearance = data.components;
                        renderMenu(state);
                    }
                });
            });
        });

    } else if (state.type === "appearance_face") {
        createMenuButton(`<i class="fa-solid fa-chevron-left"></i> ${_U("back_btn")}`, () => { popMenu(); });

        const hb = currentAppearance.headBlend || {
            shapeFirst: 0, shapeSecond: 0, skinFirst: 0, skinSecond: 0, shapeMix: 0.0, skinMix: 0.0
        };

        createMenuSlider("Father Face Shape", 0, 45, hb.shapeFirst, (val) => {
            hb.shapeFirst = parseInt(val);
            updateHeadBlend(hb);
        });

        createMenuSlider("Mother Face Shape", 0, 45, hb.shapeSecond, (val) => {
            hb.shapeSecond = parseInt(val);
            updateHeadBlend(hb);
        });

        createMenuSlider("Father Skin Tone", 0, 45, hb.skinFirst, (val) => {
            hb.skinFirst = parseInt(val);
            updateHeadBlend(hb);
        });

        createMenuSlider("Mother Skin Tone", 0, 45, hb.skinSecond, (val) => {
            hb.skinSecond = parseInt(val);
            updateHeadBlend(hb);
        });

        createMenuSlider("Face Shape Blend", 0, 100, Math.round((hb.shapeMix || 0) * 100), (val) => {
            hb.shapeMix = parseFloat(val) / 100.0;
            updateHeadBlend(hb);
        }, (val) => `${val}%`);

        createMenuSlider("Skin Tone Blend", 0, 100, Math.round((hb.skinMix || 0) * 100), (val) => {
            hb.skinMix = parseFloat(val) / 100.0;
            updateHeadBlend(hb);
        }, (val) => `${val}%`);

    } else if (state.type === "appearance_hair") {
        createMenuButton(`<i class="fa-solid fa-chevron-left"></i> ${_U("back_btn")}`, () => { popMenu(); });

        const hairData = currentAppearance.components["2"] || { drawable: 0, texture: 0, maxDrawable: 0, maxTexture: 0 };

        createClothingItem("component", 2, "Hair", hairData.drawable, hairData.texture, hairData.maxDrawable, hairData.maxTexture,
            (newD, cb) => {
                hairData.drawable = newD;
                hairData.texture = 0;
                fetch(`https://${GetParentResourceName()}/changeComponent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ compId: 2, drawable: newD, texture: 0 })
                }).then(resp => resp.json()).then(res => {
                    hairData.maxTexture = res.maxTexture || 0;
                    currentAppearance.components["2"] = hairData;
                    cb(hairData.maxTexture);
                });
            },
            (d, newT) => {
                hairData.texture = newT;
                currentAppearance.components["2"] = hairData;
                fetch(`https://${GetParentResourceName()}/changeComponent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ compId: 2, drawable: d, texture: newT })
                });
            }
        );

        createMenuSlider("Hair Primary Color", 0, 63, currentAppearance.hairColor || 0, (val) => {
            currentAppearance.hairColor = parseInt(val);
            updateHairColor();
        });

        createMenuSlider("Hair Highlight Color", 0, 63, currentAppearance.hairHighlightColor || 0, (val) => {
            currentAppearance.hairHighlightColor = parseInt(val);
            updateHairColor();
        });

    } else if (state.type === "appearance_clothing") {
        createMenuButton(`<i class="fa-solid fa-chevron-left"></i> ${_U("back_btn")}`, () => { popMenu(); });

        Object.keys(componentNames).forEach(id => {
            const label = componentNames[id];
            const comp = currentAppearance.components[id] || { drawable: 0, texture: 0, maxDrawable: 0, maxTexture: 0 };

            createClothingItem("component", id, label, comp.drawable, comp.texture, comp.maxDrawable, comp.maxTexture,
                (newD, cb) => {
                    comp.drawable = newD;
                    comp.texture = 0;
                    fetch(`https://${GetParentResourceName()}/changeComponent`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ compId: id, drawable: newD, texture: 0 })
                    }).then(resp => resp.json()).then(res => {
                        comp.maxTexture = res.maxTexture || 0;
                        currentAppearance.components[id] = comp;
                        cb(comp.maxTexture);
                    });
                },
                (d, newT) => {
                    comp.texture = newT;
                    currentAppearance.components[id] = comp;
                    fetch(`https://${GetParentResourceName()}/changeComponent`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ compId: id, drawable: d, texture: newT })
                    });
                }
            );
        });

    } else if (state.type === "appearance_props") {
        createMenuButton(`<i class="fa-solid fa-chevron-left"></i> ${_U("back_btn")}`, () => { popMenu(); });
        Object.keys(propNames).forEach(id => {
            const label = propNames[id];
            const prop = currentAppearance.props[id] || { drawable: -1, texture: 0, maxDrawable: 0, maxTexture: 0 };

            createClothingItem("prop", id, label, prop.drawable, prop.texture, prop.maxDrawable, prop.maxTexture,
                (newD, cb) => {
                    prop.drawable = newD;
                    prop.texture = 0;
                    fetch(`https://${GetParentResourceName()}/changeProp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ propId: id, drawable: newD, texture: 0 })
                    }).then(resp => resp.json()).then(res => {
                        prop.maxTexture = res.maxTexture || 0;
                        currentAppearance.props[id] = prop;
                        cb(prop.maxTexture);
                    });
                },
                (d, newT) => {
                    prop.texture = newT;
                    currentAppearance.props[id] = prop;
                    fetch(`https://${GetParentResourceName()}/changeProp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ propId: id, drawable: d, texture: newT })
                    });
                }
            );
        });

    } else if (state.type === "appearance_save") {
        createMenuButton(`<i class="fa-solid fa-chevron-left"></i> ${_U("back_btn")}`, () => { popMenu(); });

        const container = document.createElement("div");
        container.className = "input-container selectable";
        container.onmouseenter = () => {
            const selectables = document.querySelectorAll(".selectable");
            const idx = Array.from(selectables).indexOf(container);
            if (idx !== -1) setActiveItem(idx);
        };

        const input = document.createElement("input");
        input.type = "text";
        input.className = "menu-input";
        input.placeholder = _U("character_name_placeholder");
        container.appendChild(input);

        const actions = document.createElement("div");
        actions.className = "input-actions";

        const btnSave = document.createElement("button");
        btnSave.className = "input-btn confirm selectable";
        btnSave.innerText = "Save";
        btnSave.onclick = () => {
            const charName = input.value.trim();
            if (!charName) return;

            fetch(`https://${GetParentResourceName()}/saveCharacter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: charName, appearance: currentAppearance })
            }).then(resp => resp.json()).then(data => {
                if (data.status === "success") {
                    savedCharacters = data.saved;
                    menuStack.pop();
                    popMenu();
                }
            });
        };
        btnSave.onmouseenter = () => {
            const selectables = document.querySelectorAll(".selectable");
            const idx = Array.from(selectables).indexOf(btnSave);
            if (idx !== -1) setActiveItem(idx);
        };

        const btnCancel = document.createElement("button");
        btnCancel.className = "input-btn cancel selectable";
        btnCancel.innerText = "Cancel";
        btnCancel.onclick = () => { popMenu(); };
        btnCancel.onmouseenter = () => {
            const selectables = document.querySelectorAll(".selectable");
            const idx = Array.from(selectables).indexOf(btnCancel);
            if (idx !== -1) setActiveItem(idx);
        };

        input.onkeydown = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                input.blur();
                btnSave.click();
            } else if (e.key === "ArrowDown" || e.key === "Tab") {
                e.preventDefault();
                input.blur();
                const selectables = document.querySelectorAll(".selectable");
                const currentIdx = Array.from(selectables).indexOf(container);
                if (currentIdx !== -1 && currentIdx + 1 < selectables.length) {
                    setActiveItem(currentIdx + 1);
                }
            }
        };

        actions.appendChild(btnSave);
        actions.appendChild(btnCancel);
        container.appendChild(actions);
        itemsContainer.appendChild(container);
    }

    const currentMenu = menuStack[menuStack.length - 1];
    if (currentMenu && currentMenu.type !== "export_char_code") {
        updateSelectables();
    }
}

function createClothingItem(type, id, label, currentD, currentT, maxD, maxT, onChangeD, onChangeT) {
    const itemsContainer = document.getElementById("menu-items");

    const div = document.createElement("div");
    div.className = "slider-item selectable";
    div.setAttribute("data-type", type);
    div.setAttribute("data-id", id);
    div.setAttribute("data-current-d", currentD);
    div.setAttribute("data-current-t", currentT);
    div.setAttribute("data-max-d", maxD);
    div.setAttribute("data-max-t", maxT);

    const info = document.createElement("div");
    info.className = "slider-info";
    info.style.width = "100%";
    info.style.display = "flex";
    info.style.justifyContent = "space-between";
    info.style.alignItems = "center";
    info.style.padding = "6px 2px";

    const labelSpan = document.createElement("span");
    labelSpan.className = "slider-label";
    labelSpan.innerText = label;
    info.appendChild(labelSpan);

    const valSpan = document.createElement("span");
    valSpan.className = "slider-value";
    valSpan.id = `clothing-${type}-${id}-val`;

    const formatVal = (d, t) => {
        const dText = d === -1 ? "None" : d;
        return `D:${dText} | T:${t}`;
    };

    valSpan.innerText = formatVal(currentD, currentT);
    info.appendChild(valSpan);
    div.appendChild(info);

    div.onmouseenter = () => {
        const selectables = document.querySelectorAll(".selectable");
        const idx = Array.from(selectables).indexOf(div);
        if (idx !== -1) setActiveItem(idx);
    };

    div.changeD = (direction) => {
        let d = parseInt(div.getAttribute("data-current-d"));
        let max = parseInt(div.getAttribute("data-max-d"));
        let min = type === "prop" ? -1 : 0;

        if (direction === "left") {
            d = d - 1;
            if (d < min) d = max;
        } else if (direction === "right") {
            d = d + 1;
            if (d > max) d = min;
        }

        div.setAttribute("data-current-d", d);
        div.setAttribute("data-current-t", 0);

        onChangeD(d, (newMaxT) => {
            div.setAttribute("data-max-t", newMaxT);
            valSpan.innerText = formatVal(d, 0);
        });
    };

    div.changeT = () => {
        let t = parseInt(div.getAttribute("data-current-t"));
        let maxT = parseInt(div.getAttribute("data-max-t"));
        let d = parseInt(div.getAttribute("data-current-d"));

        t = t + 1;
        if (t > maxT) t = 0;

        div.setAttribute("data-current-t", t);
        valSpan.innerText = formatVal(d, t);
        onChangeT(d, t);
    };

    itemsContainer.appendChild(div);
}
function createMenuButton(label, onClick) {
    const itemsContainer = document.getElementById("menu-items");

    const btn = document.createElement("button");
    btn.className = "menu-btn selectable";

    if (label.includes("<i") || label.includes("Exit")) {
        btn.innerHTML = label;
    } else {
        btn.innerHTML = `<span class="bullet"></span><span class="btn-text">${label}</span>`;
    }

    btn.onclick = onClick;

    btn.onmouseenter = () => {
        const selectables = document.querySelectorAll(".selectable");
        const idx = Array.from(selectables).indexOf(btn);
        if (idx !== -1) {
            setActiveItem(idx);
        }
    };

    itemsContainer.appendChild(btn);
}

function createMenuSlider(label, min, max, val, onChange, valueFormatter = null, elementId = null) {
    const itemsContainer = document.getElementById("menu-items");

    const div = document.createElement("div");
    div.className = "slider-item selectable";

    const info = document.createElement("div");
    info.className = "slider-info";

    const labelSpan = document.createElement("span");
    labelSpan.className = "slider-label";
    labelSpan.innerText = label;
    info.appendChild(labelSpan);

    const valSpan = document.createElement("span");
    valSpan.className = "slider-value";
    if (elementId) valSpan.id = `${elementId}-val`;

    const formatValue = (v) => {
        if (valueFormatter) return valueFormatter(v);
        return `${v} / ${max}`;
    };

    valSpan.innerText = formatValue(val);
    info.appendChild(valSpan);
    div.appendChild(info);

    const row = document.createElement("div");
    row.className = "slider-row";

    const btnLeft = document.createElement("button");
    btnLeft.className = "slider-arrow left-arrow";
    btnLeft.innerHTML = `<i class="fa-solid fa-chevron-left"></i>`;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "menu-slider";
    slider.min = min;
    slider.max = max;
    slider.value = val;
    if (elementId) slider.id = elementId;

    const btnRight = document.createElement("button");
    btnRight.className = "slider-arrow right-arrow";
    btnRight.innerHTML = `<i class="fa-solid fa-chevron-right"></i>`;

    btnLeft.onclick = () => {
        let v = parseInt(slider.value) - 1;
        if (v < min) v = max;
        slider.value = v;
        valSpan.innerText = formatValue(v);
        onChange(v);
    };

    btnRight.onclick = () => {
        let v = parseInt(slider.value) + 1;
        if (v > max) v = min;
        slider.value = v;
        valSpan.innerText = formatValue(v);
        onChange(v);
    };

    slider.oninput = (e) => {
        const v = e.target.value;
        valSpan.innerText = formatValue(v);
        onChange(v);
    };

    row.appendChild(btnLeft);
    row.appendChild(slider);
    row.appendChild(btnRight);
    div.appendChild(row);

    div.onmouseenter = () => {
        const selectables = document.querySelectorAll(".selectable");
        const idx = Array.from(selectables).indexOf(div);
        if (idx !== -1) {
            setActiveItem(idx);
        }
    };

    itemsContainer.appendChild(div);
}

function updateHeadBlend(hb) {
    currentAppearance.headBlend = hb;
    fetch(`https://${GetParentResourceName()}/changeHeadBlend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headBlend: hb })
    });
}

function updateHairColor() {
    fetch(`https://${GetParentResourceName()}/changeHairColor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            color: currentAppearance.hairColor,
            highlight: currentAppearance.hairHighlightColor
        })
    });
}

function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).catch(err => {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
}

