const vscode = require('vscode');
const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path')

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	vscode.window.showInformationMessage('Neocities extension is now active!');
	vscode.commands.registerCommand('neocities.login', async function () {
		const username = await vscode.window.showInputBox({
        prompt: 'Enter your username',
        placeHolder: 'username',
				ignoreFocusOut: true
    });

    const password = await vscode.window.showInputBox({
        prompt: 'Enter your password',
        placeHolder: 'password',
        password: true, 
				ignoreFocusOut: true
    });

		if (username && password) {
			const credentials = btoa(`${username}:${password}`);
			fetch('https://neocities.org/api/key', {
				headers: {
					'Authorization': `Basic ${credentials}`
				}
			}).then(response => {
				if (response.status === 200) {
					response.json().then(data => {
						if (!data.api_key) {
							vscode.window.showErrorMessage('Login failed');
							return;
						}
						context.secrets.store('neocities.api_key', data.api_key);
						vscode.window.showInformationMessage('Login successful');
					});
				} else {
					vscode.window.showErrorMessage('Login failed');
				}
			});

		}
	})

	vscode.commands.registerCommand('neocities.set_api_key', async function () {
		const api_key = await vscode.window.showInputBox({
			prompt: 'Enter your Neocities API key',
			placeHolder: 'api_key',
			ignoreFocusOut: true
		});

		if (api_key) {
			await context.secrets.store('neocities.api_key', api_key);
			vscode.window.showInformationMessage('API key set successfully');
		} else {
			vscode.window.showErrorMessage('API key cannot be empty');
		}
	})


	vscode.commands.registerCommand('neocities.logout', async function () {
		await context.secrets.delete('neocities.api_key');
		vscode.window.showInformationMessage('Logout successful');
	})

	vscode.commands.registerCommand('neocities.push', async function () {
		const api_key = await context.secrets.get('neocities.api_key');
		if (!api_key) {
			vscode.window.showErrorMessage(
				'Please login first',
				{ title: 'Login', command: 'neocities.login' },
			).then(async ({title, command}) => {
				console.log(title, command);
				if (command) {
					await vscode.commands.executeCommand(command);
				}
			})
			return;
		}	

		const subdirectory = vscode.workspace.getConfiguration('neocities').get('subdirectory');
		let glob = "**/*"
		if (subdirectory !== "") {
			glob = subdirectory + "/" + glob;
		}		
		const file_names = await vscode.workspace.findFiles(glob);
		console.log(file_names);

		const local_files = await Promise.all(file_names.map(async (file_path) => {
			const content = await fs.readFile(file_path.fsPath);
			const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
			const buildDirectory = path.join(workspaceRoot, subdirectory);

			let relativePath = path.relative(buildDirectory, file_path.fsPath);
			// normalize windows paths to use '/' as seperator
			if (path.sep == "\\") {
				relativePath = relativePath.replace(/\\/g, '/')
			}
			
			console.log(`Processing file: ${relativePath}`);
			const file = new File([content], relativePath);
			file.sha1_hash = crypto.createHash('sha1').update(content).digest('hex');
			return file 
		}));
		console.log(local_files)

		let upload_files = [];
		let delete_files = [];
		await fetch("https://neocities.org/api/list", {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${api_key}`
			}
		}).then(async response => {
			if (response.status == 200) {
				const data = await response.json();
				const remote_files = data.files;	

				upload_files = local_files.filter(local_file => {
					const remote_file = remote_files.find(remote_file => {
						return remote_file.path == local_file.name
					});

					if (!remote_file) {
						console.info(`${local_file.name} not found on remote`)
						return true;
					}
					if (remote_file.sha1_hash !== local_file.sha1_hash) {
						console.info(`${local_file.name} has changed`)
						return true;
					}
					console.info(`${local_file.name} not changed`)
					return false;
				});

				delete_files = remote_files
					.filter(remote_file => !remote_file.is_directory)
					.filter(remote_file => {
						console.log("remote file: " + remote_file.path);
						const local_file = local_files.find(local_file => local_file.name == remote_file.path);
						if (!local_file) {
							console.info(`remote file ${remote_file.path} not found locally`)
							return true;
						}
						return false;
					});
			}
		})

		if (upload_files.length > 0) {
			upload_files.forEach(file => {console.info("uploading: " + file.name)})
			const upload_file_form = new FormData();
			for (const file of upload_files) {
				upload_file_form.append(file.name, file);
			}
			fetch('https://neocities.org/api/upload', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${api_key}`
				},
				body: upload_file_form
			}).then(response => {
				if (response.status === 200) {
					vscode.window.showInformationMessage('Files uploaded');
				} else {
					response.text().then(text => {
						console.error(text);
					})
					vscode.window.showErrorMessage('Upload failed');
				}
			})
		} else {
			vscode.window.showInformationMessage('No files to upload');
		}

		if (delete_files.length > 0) {
			delete_files.forEach(file => {console.info("deleting: " + file.path)})
			const delete_file_form = new URLSearchParams();
			for (const file of delete_files) {
				delete_file_form.append('filenames[]', file.path);
			}
			fetch('https://neocities.org/api/delete', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${api_key}`
				},
				body: delete_file_form
			}).then(response => {
				if (response.status === 200) {
					vscode.window.showInformationMessage('Files deleted');
				} else {
					response.text().then(text => {
						console.error(text);
					})
					vscode.window.showErrorMessage('Delete failed');
				}
			})
		} else {
			vscode.window.showInformationMessage('No files to delete');
		}
	});
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
