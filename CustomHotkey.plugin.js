/**
 * @name CustomHotkey
 * @author Oskar#2843
 * @authorId 477459599071641611
 * @version 1.1.1
 * @description Adds custom hotkeys like leave call
 * @website https://github.com/Oskar1504
 */

module.exports = (_ => {
	const changeLog = {
		
	};
	
	return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
		constructor (meta) {for (let key in meta) this[key] = meta[key];}
		getName () {return this.name;}
		getAuthor () {return this.author;}
		getVersion () {return this.version;}
		getDescription () {return `The Library Plugin needed for ${this.name} is missing. Open the Plugin Settings to download it. \n\n${this.description}`;}
		
		downloadLibrary () {
			require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
				if (!e && b && r.statusCode == 200) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
				else BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
			});
		}
		
		load () {
			if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
			if (!window.BDFDB_Global.downloadModal) {
				window.BDFDB_Global.downloadModal = true;
				BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${this.name} is missing. Please click "Download Now" to install it.`, {
					confirmText: "Download Now",
					cancelText: "Cancel",
					onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
					onConfirm: _ => {
						delete window.BDFDB_Global.downloadModal;
						this.downloadLibrary();
					}
				});
			}
			if (!window.BDFDB_Global.pluginQueue.includes(this.name)) window.BDFDB_Global.pluginQueue.push(this.name);
		}
		start () {this.load();}
		stop () {}
		getSettingsPanel () {
			let template = document.createElement("template");
			template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${this.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
			template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
			return template.content.firstElementChild;
		}
	} : (([Plugin, BDFDB]) => {
		var _this;
		var toggleButton;
		
		var sounds = [], keybinds;
		
		return class GameActivityToggle extends Plugin {
			onLoad () {
				_this = this;
				
				sounds = [(BDFDB.ModuleUtils.findByString("undeafen", "deafen", "robot_man", "mute", {defaultExport: false}) || {exports: {keys: (_ => [])}}).exports.keys()].flat(10).filter(n => n).map(s => s.replace("./", "").split(".")[0]).sort();
				
				this.css = `
					${BDFDB.dotCNS._gameactivitytoggleadded + BDFDB.dotCNC.accountinfowithtagasbutton + BDFDB.dotCNS._gameactivitytoggleadded + BDFDB.dotCN.accountinfowithtagless} {
						flex: 1;
						min-width: 0;
					}
				`;
			}
			
			onStart () {
				let cachedState = BDFDB.DataUtils.load(this, "cachedState");
				let state = BDFDB.DiscordUtils.getSetting("status", "showCurrentGame");
				if (!cachedState.date || (new Date() - cachedState.date) > 1000*60*60*24*3) {
					cachedState.value = state;
					cachedState.date = new Date();
					BDFDB.DataUtils.save(cachedState, this, "cachedState");
				}
				else if (cachedState.value != null && cachedState.value != state) BDFDB.DiscordUtils.setSetting("status", "showCurrentGame", cachedState.value);
				
				let SettingsStore = BDFDB.DiscordUtils.getSettingsStore();
				if (SettingsStore) BDFDB.PatchUtils.patch(this, SettingsStore, "updateAsync", {after: e => {
					if (e.methodArguments[0] != "status") return;
					let newSettings = {value: undefined};
					e.methodArguments[1](newSettings);
					if (newSettings.showCurrentGame != undefined) {
						if (toggleButton) toggleButton.props.forceState = newSettings.showCurrentGame.value;
						BDFDB.ReactUtils.forceUpdate(toggleButton);
						BDFDB.DataUtils.save({date: new Date(), value: newSettings.showCurrentGame.value}, this, "cachedState");
					}
				}});

				keybinds = BDFDB.DataUtils.load(this, "keybinds");
				
				//Set default hotkeys
				if(Object.keys(keybinds).length == 0){
					keybinds = {
						"leaveCall":[114],
						"debug":[115]
					}
					BDFDB.DataUtils.save(keybinds, this, "keybinds")
				}
				console.log(keybinds)


				Object.keys(keybinds).forEach(key => {
					if(keybinds[key].length > 0){
						if(this.hotkeyHandlers[key]){
							this.activateKeybind(key, key, this.hotkeyHandlers[key]);
						}else{
							console.warn(`[OPE] No handler function for hotkey '${key}' defined`)
						}
					}
				})

				
				//BDFDB.DiscordUtils.rerenderAll();
			}

			hotkeyHandlers = {
				leaveCall(){
					console.log("[OPE] leaveCall handler runned")
					try {
						document.querySelector("button[aria-label='Verbindung trennen'").click()
					} catch (error) {
						console.log("[OPE] no leave call button found")
					}
				},
				debug(){
					console.log("[OPE] debug handler runned")
				}
			}
			
			onStop () {
				BDFDB.DiscordUtils.rerenderAll();
			}

			getSettingsPanel (collapseStates = {}) {
				let settingsPanel;
				return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, {
					collapseStates: collapseStates,
					children: _ => {
						let settingsItems = [];

						Object.keys(keybinds).forEach(key => {
							settingsItems.push(BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.settingsrowcontainer,
								children: BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.settingsrowlabel,
									children: [
										BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsLabel, {
											label: `${key} Hotkey`
										}),
										BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex.Child, {
											className: BDFDB.disCNS.settingsrowcontrol + BDFDB.disCN.flexchild,
											grow: 0,
											wrap: true,
											children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.KeybindRecorder, {
												value: !keybinds[key] ? [] : keybinds[key],
												reset: true,
												onChange: value => {
													keybinds[key] = value;
													BDFDB.DataUtils.save(keybinds, this, "keybinds")
													this.activateKeybind(key, key, this.hotkeyHandlers[key]);
												}
											})
										})
									].flat(10).filter(n => n)
								})
							}));
						})
						
						
						return settingsItems;
					}
				});
			}
			
			// processMenu (e) {
			// }
			
			// processAccount (e) {
			// }
			
			activateKeybind (name, type, handler) {
				console.log("activateKeybind", name)
				if (keybinds[type] && keybinds[type].length) BDFDB.ListenerUtils.addGlobal(this, name, keybinds[type], _ => handler());
				else BDFDB.ListenerUtils.removeGlobal(this, name);
			}

		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();
