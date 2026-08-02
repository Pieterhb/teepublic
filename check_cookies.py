import json, os
cookie_file = 'data/session_cookies.json'
if os.path.exists(cookie_file):
    with open(cookie_file) as f:
        data = json.load(f)
    cookies = data.get('cookies', [])
    print(f'Total cookies saved: {len(cookies)}')
    cf_cookies = [c for c in cookies if 'cf' in c.get('name','').lower() or 'teepublic' in c.get('domain','').lower()]
    print(f'TeePublic/CF cookies: {len(cf_cookies)}')
    for c in cf_cookies:
        name = c['name']
        domain = c['domain']
        expires = c.get('expires', 'session')
        print(f'  {name} @ {domain} (expires: {expires})')
else:
    print('No session cookies file found!')
