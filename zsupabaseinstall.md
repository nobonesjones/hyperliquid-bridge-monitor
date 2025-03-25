### 	Prerequisites


	Installing the server requires the following on your system:

			- Python 3.12+

	If you plan to install via `uv`, ensure it's [installed](https://docs.astral.sh/uv/getting-started/installation/#__tabbed_1_1).

### 	Step 1. Installation


	Since v0.2.0 I introduced support for package installation. You can use your favorite Python package manager to install the server via:

# 	if pipx is installed (recommended)


	pipx install supabase-mcp-server

### 	Step 2. Configuration


	The Supabase MCP server requires configuration to connect to your Supabase database, access the Management API, and use the Auth Admin SDK. This section explains all available configuration options and how to set them up.

#### 	Environment Variables


	The server uses the following environment variables:

### Table


**Variable**

**Required**

**Default**

**Description**

`SUPABASE_PROJECT_REF`

Yes

`127.0.0.1:54322`

Your Supabase project reference ID (or local host:port)

`SUPABASE_DB_PASSWORD`

Yes

`postgres`

Your database password

`SUPABASE_REGION`

Yes*

`us-east-1`

AWS region where your Supabase project is hosted

`SUPABASE_ACCESS_TOKEN`

No

None

Personal access token for Supabase Management API

`SUPABASE_SERVICE_ROLE_KEY`

No

None

Service role key for Auth Admin SDK
> 	**Note**: The default values are configured for local Supabase development. For remote Supabase projects, you must provide your own values for `SUPABASE_PROJECT_REF` and `SUPABASE_DB_PASSWORD`.

> 	🚨 C**RITICAL CONFIGURATION NOTE:** For remote Supabase projects, you MUST specify the correct region where your project is hosted using S`UPABASE_REGION.` If you encounter a "Tenant or user not found" error, this is almost certainly because your region setting doesn't match your project's actual region. You can find your project's region in the Supabase dashboard under Project Settings.


#### 	Connection Types


#### 	Database Connection


			- The server connects to your Supabase PostgreSQL database using the transaction pooler endpoint

			- Remote projects use the format: `postgresql://postgres.[project_ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

#### 	Setting Up Configuration


#### 	Option 1: Client-Specific Configuration (Recommended)


	Set environment variables directly in your MCP client configuration (see client-specific setup instructions in Step 3). Most MCP clients support this approach, which keeps your configuration with your client settings.

#### 	Option 3: Project-Specific Configuration (Source Installation Only)


	If you're running the server from source (not via package), you can create a `.env` file in your project directory with the same format as above.

#### 	Finding Your Supabase Project Information


			- **Project Reference**: Found in your Supabase project URL: `https://supabase.com/dashboard/project/<project-ref>`

			- **Database Password**: Set during project creation or found in Project Settings → Database

			- **Access Token**: Generate at [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)

			- **Service Role Key**: Found in Project Settings → API → Project API keys

#### 	Supported Regions


	The server supports all Supabase regions:

#### 	Cursor


	Go to Settings -> Features -> MCP Servers and add a new server with this configuration:

# 	can be set to any name


	name: supabase

	type: command

# 	if you installed with pipx


	command: supabase-mcp-server

# 	if you installed with uv


	command: uv run supabase-mcp-server

# 	if the above doesn't work, use the full path (recommended)


	command: /full/path/to/supabase-mcp-server  # Find with 'which supabase-mcp-server' (macOS/Linux) or 'where supabase-mcp-server' (Windows)

![image](https://private-user-images.githubusercontent.com/54005466/415990955-45df080a-8199-4aca-b59c-a84dc7fe2c09.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDIzNTg4MTcsIm5iZiI6MTc0MjM1ODUxNywicGF0aCI6Ii81NDAwNTQ2Ni80MTU5OTA5NTUtNDVkZjA4MGEtODE5OS00YWNhLWI1OWMtYTg0ZGM3ZmUyYzA5LnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTAzMTklMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUwMzE5VDA0MjgzN1omWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTRkMWVlZDRiZTNhNjg1OTI3MDgxM2ViZjMyZTUzMTdmYzEwYzUyNmM3ZDYwZmQyZTMwNjJlYTUwMDkzZjgyZTAmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.37qXzYVjFxZUM0M_GfT1XMLtS54MjDamsv3kse1APFA)

	If configuration is correct, you should see a green dot indicator and the number of tools exposed by the server.](https://private-user-images.githubusercontent.com/54005466/415990955-45df080a-8199-4aca-b59c-a84dc7fe2c09.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDIzNTg4MTcsIm5iZiI6MTc0MjM1ODUxNywicGF0aCI6Ii81NDAwNTQ2Ni80MTU5OTA5NTUtNDVkZjA4MGEtODE5OS00YWNhLWI1OWMtYTg0ZGM3ZmUyYzA5LnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTAzMTklMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUwMzE5VDA0MjgzN1omWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTRkMWVlZDRiZTNhNjg1OTI3MDgxM2ViZjMyZTUzMTdmYzEwYzUyNmM3ZDYwZmQyZTMwNjJlYTUwMDkzZjgyZTAmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.37qXzYVjFxZUM0M_GfT1XMLtS54MjDamsv3kse1APFA) [

#### 	Windsurf


	Go to Cascade -> Click on the hammer icon -> Configure -> Fill in the configuration:

	{  
"mcpServers": {  
"supabase": {  
"command": "/Users/username/.local/bin/supabase-mcp-server",  // update path  
"env": {  
"SUPABASE_PROJECT_REF": "your-project-ref",  
"SUPABASE_DB_PASSWORD": "your-db-password",  
"SUPABASE_REGION": "us-east-1",  // optional, defaults to us-east-1  
"SUPABASE_ACCESS_TOKEN": "your-access-token",  // optional, for management API  
"SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"  // optional, for Auth Admin SDK  
}  
}  
}

	}

	If configuration is correct, you should see green dot indicator and clickable supabase server in the list of available servers.
