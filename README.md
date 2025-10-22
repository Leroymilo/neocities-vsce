# neocities README

this extension should help you manage your neocities site. 


## Getting Started
1. Open the command pallete with `Cmnd+Shift+P` then type `Neocities: Login`
2. Use `Neocities: Push` to sync your local workspace with your neocities site
> [!CAUTION]
> Push will delete any files from your neocities site if they aren't in your local workspace

## Commands
### Neocities: Login
This will prompt you for your `user name` and `password`. Then it will fetch your `api key` and store it securely. 
> [!NOTE]
> Api Keys are a way for programs to authenticate requests

### Neocities: Logout
This will remove your api key

### Neocities: Push
This sync your local workspace with your neocities site. 
It does the following:
1. Adds any new files
2. Updates any changed files
3. Removes any files not in your local workspace

### Neocities: Set API Key
This allows you to directly set your API key if you don't want to use the login command

## Settings
### subdirectory (BETA)
Use this to publish files from a subdirectory of your workspace. This is useful if you want to use a [Static Site Generator](https://en.wikipedia.org/wiki/Static_site_generator?useskin=vector) like  [11ty](https://www.11ty.dev/), [Jekyll](https://jekyllrb.com/), or [Hugo](https://gohugo.io/).


## Roadmap
- [ ] add [walkthrough](https://code.visualstudio.com/api/ux-guidelines/walkthroughs)
- [ ] add .neoignore
- [ ] add dialog to confirm file deletion
- [ ] add [view](https://code.visualstudio.com/api/ux-guidelines/views) to show what files you've added, changed, deleted. as well as a publish button.