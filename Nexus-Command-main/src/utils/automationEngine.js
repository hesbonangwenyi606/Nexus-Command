// Automation rules engine - applies IF-THEN rules to emails

export function evaluateCondition(email, rule) {
  const { condition_field, condition_operator, condition_value } = rule
  const value = (condition_value || '').toLowerCase()

  let fieldValue = ''
  switch (condition_field) {
    case 'subject':
      fieldValue = (email.subject || '').toLowerCase()
      break
    case 'from_address':
      fieldValue = (email.from_address || '').toLowerCase()
      break
    case 'from_domain':
      fieldValue = (email.from_address || '').toLowerCase().split('@')[1] || ''
      break
    case 'body':
      fieldValue = (email.body_text || '').toLowerCase()
      break
    case 'to_address':
      fieldValue = (email.to_address || '').toLowerCase()
      break
    default:
      return false
  }

  switch (condition_operator) {
    case 'contains':
      return fieldValue.includes(value)
    case 'not_contains':
      return !fieldValue.includes(value)
    case 'equals':
      return fieldValue === value
    case 'starts_with':
      return fieldValue.startsWith(value)
    case 'ends_with':
      return fieldValue.endsWith(value)
    case 'matches_domain':
      return fieldValue === value || fieldValue.endsWith('.' + value)
    default:
      return false
  }
}

export function applyRules(emails, rules) {
  const results = []

  for (const email of emails) {
    const firedRules = []
    for (const rule of rules) {
      if (!rule.active) continue
      if (evaluateCondition(email, rule)) {
        firedRules.push(rule)
      }
    }
    results.push({ email, firedRules })
  }

  return results
}

export function describeRule(rule) {
  const fieldLabels = {
    subject: 'Subject',
    from_address: 'Sender email',
    from_domain: 'Sender domain',
    body: 'Email body',
    to_address: 'Recipient'
  }

  const opLabels = {
    contains: 'contains',
    not_contains: 'does not contain',
    equals: 'equals',
    starts_with: 'starts with',
    ends_with: 'ends with',
    matches_domain: 'is from domain'
  }

  const actionLabels = {
    tag: 'Tag as',
    add_to_jobs: 'Add to Job Tracker',
    auto_reply: 'Auto-reply with template',
    mark_read: 'Mark as read',
    add_contact: 'Add sender to Contacts'
  }

  const field = fieldLabels[rule.condition_field] || rule.condition_field
  const op = opLabels[rule.condition_operator] || rule.condition_operator
  const action = actionLabels[rule.action_type] || rule.action_type

  return `IF ${field} ${op} "${rule.condition_value}" THEN ${action}${rule.action_value ? ` "${rule.action_value}"` : ''}`
}

export function getActionTypes() {
  return [
    { value: 'tag', label: 'Tag Email' },
    { value: 'add_to_jobs', label: 'Add to Job Tracker' },
    { value: 'auto_reply', label: 'Auto-Reply with Template' },
    { value: 'mark_read', label: 'Mark as Read' },
    { value: 'add_contact', label: 'Add Sender to Contacts' }
  ]
}

export function getConditionFields() {
  return [
    { value: 'subject', label: 'Subject Contains' },
    { value: 'from_address', label: 'Sender Is' },
    { value: 'from_domain', label: 'Sender Domain' },
    { value: 'body', label: 'Body Contains' },
    { value: 'to_address', label: 'Recipient Is' }
  ]
}

export function getConditionOperators() {
  return [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does Not Contain' },
    { value: 'equals', label: 'Equals' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'matches_domain', label: 'Matches Domain' }
  ]
}
