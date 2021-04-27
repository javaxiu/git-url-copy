import * as vscode from 'vscode';
import * as clipboard from 'clipboardy';
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';

//Write to output.
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.copyGitPath', (textEditor, edit) => {
		const line = textEditor.selection.start.line + 1;
		const file = textEditor.document.uri.path;
		const fileRelativePath = vscode.workspace.asRelativePath(file);
		const cwd = path.dirname(file);
		
		// https://code.aone.alibaba-inc.com/it-service/alilang/blob/master/src/i18n/index.ts#L6
		const webUrl = `https://code.aone.alibaba-inc.com/${getRepository(cwd)}/blob/${getCurrentBranch(cwd)}/${fileRelativePath}#L${line}`;
		clipboard.write('code copy success' + webUrl);
		vscode.window.showInformationMessage(webUrl);
	}));
}


function getCurrentBranch(cwd?: string) {
	return childProcess.execSync('git branch --show-current', {encoding: 'utf8', cwd});
}

function getRepository(cwd?: string) {
	const remoteUrl = childProcess.execSync('git config --get remote.origin.url', {encoding: 'utf8', cwd});
	if (remoteUrl.startsWith('git@')) {
		// git@gitlab.alibaba-inc.com:platform/alinw-live.git
		return remoteUrl.match(':(.*)\.git')![1];
	}
}