import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import subprocess
import os
import sys

# Simple dark theme colors matching the site
BG_COLOR = "#0a0f1c"
CARD_COLOR = "#111827"
TEXT_COLOR = "#e2e8f0"
ACCENT = "#6366f1"
BORDER = "#1f2937"

class PushTool:
    def __init__(self, root):
        self.root = root
        self.root.title("Aether Push Tool")
        self.root.geometry("700x600")
        self.root.configure(bg=BG_COLOR)
        
        # Make it look nicer
        self.root.option_add('*Font', 'Inter 11')
        
        self.project_dir = os.path.dirname(os.path.abspath(__file__))
        
        self.create_widgets()
        self.refresh_status()
    
    def create_widgets(self):
        # Title
        title = tk.Label(self.root, text="Aether Push Tool", 
                         font=("Space Grotesk", 22, "bold"),
                         bg=BG_COLOR, fg=TEXT_COLOR)
        title.pack(pady=(20, 5))
        
        subtitle = tk.Label(self.root, text="Push changes to Vercel (GitHub)", 
                            bg=BG_COLOR, fg="#64748b", font=("Inter", 12))
        subtitle.pack(pady=(0, 15))
        
        # Status Frame
        status_frame = tk.Frame(self.root, bg=CARD_COLOR, bd=1, relief="solid")
        status_frame.pack(fill="x", padx=20, pady=10)
        
        tk.Label(status_frame, text="Changed Files", bg=CARD_COLOR, fg="#94a3b8",
                 font=("Inter", 11, "bold")).pack(anchor="w", padx=15, pady=(10, 5))
        
        self.status_text = scrolledtext.ScrolledText(
            status_frame, height=8, bg="#0a0f1c", fg=TEXT_COLOR,
            insertbackground=TEXT_COLOR, relief="flat", font=("Consolas", 11)
        )
        self.status_text.pack(fill="both", padx=15, pady=(0, 15), expand=False)
        
        # Commit Message
        msg_frame = tk.Frame(self.root, bg=BG_COLOR)
        msg_frame.pack(fill="x", padx=20, pady=5)
        
        tk.Label(msg_frame, text="Commit Message", bg=BG_COLOR, fg="#94a3b8",
                 font=("Inter", 11, "bold")).pack(anchor="w")
        
        self.commit_msg = tk.Entry(msg_frame, bg=CARD_COLOR, fg=TEXT_COLOR,
                                   insertbackground=TEXT_COLOR, relief="flat",
                                   font=("Inter", 12), bd=1)
        self.commit_msg.pack(fill="x", pady=(5, 10), ipady=8)
        self.commit_msg.insert(0, "Update tracks")
        
        # Buttons
        btn_frame = tk.Frame(self.root, bg=BG_COLOR)
        btn_frame.pack(fill="x", padx=20, pady=15)
        
        self.refresh_btn = tk.Button(
            btn_frame, text="Refresh Status", command=self.refresh_status,
            bg=CARD_COLOR, fg=TEXT_COLOR, relief="flat", padx=20, pady=10,
            font=("Inter", 11)
        )
        self.refresh_btn.pack(side="left")
        
        self.push_btn = tk.Button(
            btn_frame, text="Push to Vercel", command=self.push_changes,
            bg=ACCENT, fg="white", relief="flat", padx=30, pady=12,
            font=("Inter", 13, "bold")
        )
        self.push_btn.pack(side="right", fill="x", expand=True)
        
        # Log
        log_frame = tk.Frame(self.root, bg=BG_COLOR)
        log_frame.pack(fill="both", expand=True, padx=20, pady=(10, 20))
        
        tk.Label(log_frame, text="Output", bg=BG_COLOR, fg="#94a3b8",
                 font=("Inter", 11, "bold")).pack(anchor="w")
        
        self.log = scrolledtext.ScrolledText(
            log_frame, height=10, bg="#020617", fg="#cbd5e1",
            insertbackground=TEXT_COLOR, relief="flat", font=("Consolas", 10)
        )
        self.log.pack(fill="both", expand=True)
    
    def log_message(self, message, error=False):
        self.log.insert(tk.END, message + "\n")
        self.log.see(tk.END)
        self.log.update()
    
    def refresh_status(self):
        self.status_text.delete("1.0", tk.END)
        try:
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=self.project_dir,
                capture_output=True, text=True, check=True
            )
            
            if not result.stdout.strip():
                self.status_text.insert(tk.END, "No changes detected.")
                self.push_btn.config(state="disabled")
            else:
                self.status_text.insert(tk.END, result.stdout)
                self.push_btn.config(state="normal")
                
        except subprocess.CalledProcessError as e:
            self.status_text.insert(tk.END, f"Error checking git status:\n{e}")
            self.push_btn.config(state="disabled")
        except FileNotFoundError:
            self.status_text.insert(tk.END, "Git is not installed or not in PATH.")
            self.push_btn.config(state="disabled")
    
    def push_changes(self):
        commit_msg = self.commit_msg.get().strip()
        if not commit_msg:
            messagebox.showerror("Error", "Please enter a commit message.")
            return
        
        self.push_btn.config(state="disabled", text="Pushing...")
        self.log.delete("1.0", tk.END)
        
        try:
            # Add all changes
            self.log_message("→ Staging changes...")
            subprocess.run(["git", "add", "."], cwd=self.project_dir, check=True)
            
            # Commit
            self.log_message(f"→ Committing with message: {commit_msg}")
            subprocess.run(["git", "commit", "-m", commit_msg], 
                          cwd=self.project_dir, check=True, capture_output=True)
            
            # Push
            self.log_message("→ Pushing to GitHub (this will trigger Vercel deploy)...")
            result = subprocess.run(["git", "push"], cwd=self.project_dir, 
                                   capture_output=True, text=True, check=True)
            
            self.log_message("\n✅ Successfully pushed!")
            self.log_message("Vercel is now deploying. Wait ~30-60 seconds then hard refresh the site.")
            
            messagebox.showinfo("Success", "Changes pushed to Vercel!\n\nWait 30-60 seconds and hard refresh the live site.")
            
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr or e.stdout or str(e)
            self.log_message(f"\n❌ Error:\n{error_msg}")
            messagebox.showerror("Push Failed", f"Git error:\n\n{error_msg}")
        except Exception as e:
            self.log_message(f"\n❌ Unexpected error: {str(e)}")
            messagebox.showerror("Error", str(e))
        finally:
            self.push_btn.config(state="normal", text="Push to Vercel")
            self.refresh_status()

if __name__ == "__main__":
    root = tk.Tk()
    app = PushTool(root)
    root.mainloop()