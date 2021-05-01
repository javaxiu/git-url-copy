import * as vscode from 'vscode';
import * as clipboard from 'clipboardy';
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.copyGitPath', (textEditor, edit) => {
		const line = textEditor.selection.start.line + 1;
		const file = textEditor.document.uri.path;
		const fileRelativePath = vscode.workspace.asRelativePath(file);
		const cwd = path.dirname(file);
		try {
			let repositoryBase = getRepositoryBaseFromPackageJson(file) || getRepository(cwd);
			if (!repositoryBase) throw new Error('cant\' find git repository');
			repositoryBase = gitPath2Http(repositoryBase);
			
			// https://github.com/javaxiu/git-url-copy/blob/main/src/extension.ts#L18
			const webUrl = `${repositoryBase}/blob/${getCurrentBranch(cwd)}/${fileRelativePath}#L${line}`;
			clipboard.write(webUrl);
			vscode.window.showInformationMessage('code copy success ' + webUrl);
		} catch (e) {
			vscode.window.showWarningMessage('copy failed ' + e.message);
		}
	}));
}


function getCurrentBranch(cwd?: string) {
	return childProcess.execSync('git branch --show-current', {encoding: 'utf8', cwd}).trim();
}

function getRepository(cwd?: string) {
	const remoteUrl = childProcess.execSync('git config --get remote.origin.url', {encoding: 'utf8', cwd});
	if (remoteUrl.startsWith('git@')) {
		// git@github.com:javaxiu/git-url-copy.git
		return remoteUrl.match(':(.*)\.git')![1];
	}
}

function getRepositoryBaseFromPackageJson(file: string): string {
	const folder2Scan = fs.statSync(file).isFile() ? path.dirname(file) : file;
	const jsonPath = path.resolve(folder2Scan, 'package.json');
  if (fs.existsSync(jsonPath)) {
    const repo = require(jsonPath).repository;
    return repo ? repo.url : '';
  } else {
    const nextScan = path.dirname(folder2Scan);
    if (nextScan === folder2Scan) return '';
    return getRepositoryBaseFromPackageJson(nextScan)
  }
}

function gitPath2Http(g: string) {
	const match = g.match(/git@(.*):(.*)\/(.*)\.git/);
	if (!match) return g;
	const repositoryBase = vscode.workspace.getConfiguration().get<Array<Array<string>>>('gitUrlCopy.repositoryBase') || [];
	const customRepository = repositoryBase.find(pair => pair[0] === match[1])?.[1];
	return `https://${customRepository || match[1]}/${match[2]}/${match[3]}`;
}