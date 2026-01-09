# Security Configuration Guide

## Database Security Status

### ✅ Fixed via Migrations

The following security issues have been automatically fixed through database migrations:

1. **Missing Indexes** - Added indexes for all foreign keys
2. **RLS Policy Performance** - All policies now use `(SELECT auth.uid())` for optimal performance
3. **Multiple Permissive Policies** - Consolidated into single, comprehensive policies per action
4. **Overly Permissive Insert Policies** - Restricted system operations to proper ownership

### 📋 Manual Configuration Required

The following settings must be configured in the Supabase Dashboard:

## 1. Enable Leaked Password Protection

**What**: Prevents users from using passwords that have been compromised in data breaches.

**How to Enable**:
1. Go to Supabase Dashboard
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Find **Password Protection** section
5. Enable **"Check passwords against HaveIBeenPwned.org"**
6. Click **Save**

**Benefit**: Significantly reduces the risk of account compromise from credential stuffing attacks.

---

## 2. Configure Database Connection Strategy

**What**: Use percentage-based connection allocation instead of fixed numbers for better scalability.

**How to Configure**:
1. Go to Supabase Dashboard
2. Select your project
3. Navigate to **Database** → **Connection Pooling**
4. Find **Auth Connection Pool** settings
5. Change from **Fixed (10 connections)** to **Percentage-based**
6. Recommended: Set to **10-20% of total connections**
7. Click **Save**

**Benefit**: Automatically scales Auth server connections with your database instance size.

---

## 3. Unused Index Warnings

**Status**: ℹ️ **Informational Only - No Action Required**

The following indexes are reported as "unused":
- `idx_hosts_inventory`
- `idx_groups_inventory`
- `idx_projects_owner`
- `idx_inventories_owner`
- `idx_playbooks_project`
- `idx_templates_owner`
- `idx_jobs_template`
- `idx_jobs_status`
- `idx_jobs_triggered_by`
- `idx_job_events_job`
- `idx_job_events_timestamp`
- `idx_schedules_template`
- `idx_schedules_created_by`
- `idx_templates_inventory_id`
- `idx_templates_playbook_id`
- `idx_audit_logs_actor`
- `idx_audit_logs_timestamp`
- `idx_credentials_owner`

**Why This Is Normal**:
- These warnings appear because the database is new and hasn't processed any queries yet
- The indexes are correctly placed on foreign keys and frequently queried columns
- Once the application starts processing data, these indexes will be automatically used
- They improve query performance significantly once data exists

**When to Review**:
- After 1-2 weeks of production use
- If you see specific indexes still unused, consider removing only those
- Keep indexes on foreign keys - they're essential for JOIN operations

---

## Current Security Posture

### ✅ Implemented Security Measures

1. **Row Level Security (RLS)**
   - Enabled on all tables
   - Users can only access their own data
   - Admins have elevated permissions
   - All policies use optimized subqueries

2. **Authentication**
   - JWT-based authentication
   - Role-based access control (Admin, Manager, Operator, Viewer)
   - Secure password hashing with bcrypt

3. **Audit Trail**
   - All significant actions logged
   - Immutable audit log (users can only read their own)
   - Admins can view complete audit history

4. **Credential Security**
   - Encrypted storage for sensitive data
   - Scope-based access (user, team, global)
   - Secure credential lifecycle management

5. **Database Indexes**
   - All foreign keys indexed
   - Frequently queried columns indexed
   - Performance optimized for scale

---

## Security Checklist for Production

Before deploying to production, ensure:

- [ ] **Password Protection Enabled** (HaveIBeenPwned check)
- [ ] **Database Connection Strategy** set to percentage-based
- [ ] **SSL/TLS Enforced** for all database connections
- [ ] **MFA Enabled** for admin accounts
- [ ] **API Rate Limiting** configured
- [ ] **Backup Schedule** configured (daily recommended)
- [ ] **Monitoring & Alerts** set up for:
  - Failed login attempts
  - Unusual database activity
  - Performance degradation
- [ ] **Environment Variables** secured (not in version control)
- [ ] **Admin Password** changed from default
- [ ] **Regular Security Audits** scheduled

---

## Additional Hardening (Optional)

### Network Security
- Configure IP allowlist for database access
- Use private networking if available
- Enable VPC for production deployments

### Application Security
- Implement request rate limiting
- Add CAPTCHA for login forms
- Enable security headers (CSP, HSTS, etc.)
- Regular dependency updates

### Monitoring
- Set up log aggregation
- Configure alerting for security events
- Regular security scanning
- Performance monitoring

---

## Security Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## Support

For security concerns or questions:
1. Review Supabase documentation
2. Check application logs
3. Consult [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
4. Review [API.md](./API.md) for endpoint security
