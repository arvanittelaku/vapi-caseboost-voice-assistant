# Docker Deployment Guide - VAPI CaseBoost Voice Assistant

## 🐳 Building and Running Locally

### Build the Docker Image

```bash
docker build -t vapi-caseboost-assistant:latest .
```

**Build time**: ~2-3 minutes on first build, <30 seconds for code changes (thanks to layer caching).

**Image size**: ~130MB (Node 18 Alpine + dependencies)

### Run the Container Locally

```bash
docker run -d \
  --name vapi-assistant \
  -p 3000:3000 \
  --env-file .env \
  vapi-caseboost-assistant:latest
```

Or with individual environment variables:

```bash
docker run -d \
  --name vapi-assistant \
  -p 3000:3000 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -e VAPI_API_KEY=your_key_here \
  -e VAPI_ASSISTANT_ID=your_assistant_id \
  -e VAPI_PHONE_NUMBER_ID=your_phone_id \
  -e GHL_API_KEY=your_ghl_key \
  -e GHL_LOCATION_ID=your_location_id \
  -e GHL_CALENDAR_ID=your_calendar_id \
  -e CALENDAR_TIMEZONE=America/New_York \
  -e TWILIO_ACCOUNT_SID=your_twilio_sid \
  -e TWILIO_AUTH_TOKEN=your_twilio_token \
  -e TWILIO_PHONE_NUMBER=your_twilio_number \
  -e WEBHOOK_SECRET=your_webhook_secret \
  -e WEBHOOK_BASE_URL=https://yourdomain.com \
  vapi-caseboost-assistant:latest
```

### Test the Container

```bash
# Check health
curl http://localhost:3000/health

# Check API info
curl http://localhost:3000/

# View logs
docker logs vapi-assistant

# Follow logs in real-time
docker logs -f vapi-assistant
```

### Stop and Remove

```bash
docker stop vapi-assistant
docker rm vapi-assistant
```

---

## 🚀 AWS ECS Fargate Deployment

### Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Amazon ECR repository** created for your Docker images
3. **ECS cluster** created (Fargate launch type)
4. **Application Load Balancer** (ALB) configured with target group
5. **Secrets** stored in AWS Secrets Manager or SSM Parameter Store

### Step 1: Push Image to Amazon ECR

```bash
# Authenticate Docker to your ECR registry
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag your image
docker tag vapi-caseboost-assistant:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/vapi-caseboost-assistant:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/vapi-caseboost-assistant:latest
```

### Step 2: Create ECS Task Definition

Create a file `task-definition.json`:

```json
{
  "family": "vapi-caseboost-assistant",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "vapi-assistant",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/vapi-caseboost-assistant:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        },
        {
          "name": "CALENDAR_TIMEZONE",
          "value": "America/New_York"
        }
      ],
      "secrets": [
        {
          "name": "VAPI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:vapi/api-key"
        },
        {
          "name": "VAPI_ASSISTANT_ID",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:vapi/assistant-id"
        },
        {
          "name": "VAPI_PHONE_NUMBER_ID",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:vapi/phone-number-id"
        },
        {
          "name": "GHL_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:ghl/api-key"
        },
        {
          "name": "GHL_LOCATION_ID",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:ghl/location-id"
        },
        {
          "name": "GHL_CALENDAR_ID",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:ghl/calendar-id"
        },
        {
          "name": "TWILIO_ACCOUNT_SID",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:twilio/account-sid"
        },
        {
          "name": "TWILIO_AUTH_TOKEN",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:twilio/auth-token"
        },
        {
          "name": "TWILIO_PHONE_NUMBER",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:twilio/phone-number"
        },
        {
          "name": "WEBHOOK_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:webhook/secret"
        },
        {
          "name": "WEBHOOK_BASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:webhook/base-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/vapi-caseboost-assistant",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""],
        "interval": 30,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 40
      }
    }
  ]
}
```

Register the task definition:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### Step 3: Create or Update ECS Service

```bash
aws ecs create-service \
  --cluster your-cluster-name \
  --service-name vapi-assistant-service \
  --task-definition vapi-caseboost-assistant \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:xxx:targetgroup/xxx,containerName=vapi-assistant,containerPort=3000"
```

---

## 🔑 Required Environment Variables / Secrets

### Core VAPI Configuration
- `VAPI_API_KEY` - Your VAPI API key (get from [vapi.ai](https://vapi.ai))
- `VAPI_ASSISTANT_ID` - The assistant ID configured in VAPI dashboard
- `VAPI_PHONE_NUMBER_ID` - The phone number ID from VAPI

### GoHighLevel (GHL) Integration
- `GHL_API_KEY` - GoHighLevel API key (from GHL settings)
- `GHL_LOCATION_ID` - Your GHL location/sub-account ID
- `GHL_CALENDAR_ID` - The calendar ID for appointment booking
- `CALENDAR_TIMEZONE` - Timezone for calendar operations (e.g., `America/New_York`)

### Twilio Configuration
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number

### Webhook & Server Configuration
- `WEBHOOK_SECRET` - Secret for webhook verification (generate a random string)
- `WEBHOOK_BASE_URL` - Your public webhook URL (e.g., `https://api.yourdomain.com`)
- `PORT` - Server port (default: 3000, ECS will map this)
- `NODE_ENV` - Environment (`production` for ECS)

### Optional CaseBoost Specific
- `BOOKING_LINK_BASE` - Base URL for booking links
- `COMPANY_PHONE` - Company phone number
- `COMPANY_EMAIL` - Company email
- `COMPANY_WEBSITE` - Company website

---

## 📊 Monitoring and Troubleshooting

### View CloudWatch Logs

```bash
aws logs tail /ecs/vapi-caseboost-assistant --follow
```

### Check Service Status

```bash
aws ecs describe-services \
  --cluster your-cluster-name \
  --services vapi-assistant-service
```

### Common Issues

1. **Container fails health check**
   - Check CloudWatch logs for startup errors
   - Verify all required environment variables are set
   - Test the `/health` endpoint returns 200

2. **502 Bad Gateway from ALB**
   - Ensure target group health check path is `/health`
   - Verify security group allows traffic on port 3000
   - Check container is listening on 0.0.0.0, not 127.0.0.1

3. **Container restarts frequently**
   - Check memory/CPU limits (may need to increase from 256/512)
   - Review CloudWatch logs for out-of-memory errors
   - Verify external API credentials (VAPI, GHL, Twilio) are valid

---

## 🔒 Security Best Practices

✅ **Implemented in this Dockerfile:**
- Non-root user (nodejs:nodejs with UID 1001)
- Minimal base image (Alpine Linux)
- No secrets baked into image
- Production-optimized Node.js environment
- Proper signal handling with dumb-init
- Health checks for automatic recovery

🔐 **Additional AWS Security:**
- Store all secrets in AWS Secrets Manager (not environment variables in task definition)
- Use IAM roles for ECS tasks (taskRoleArn and executionRoleArn)
- Enable VPC Flow Logs for network monitoring
- Use private subnets with NAT Gateway if possible
- Restrict security group ingress to ALB only

---

## 🎯 Production Checklist

Before deploying to production:

- [ ] All secrets stored in AWS Secrets Manager
- [ ] CloudWatch log group created
- [ ] IAM roles configured with least privilege
- [ ] ALB health check configured to `/health`
- [ ] Security groups properly configured
- [ ] Auto-scaling policies defined (if needed)
- [ ] CloudWatch alarms set up for CPU/Memory/Health
- [ ] VAPI webhook URL updated to point to ALB DNS
- [ ] Test webhook endpoints with Postman/curl
- [ ] Monitor first few calls in CloudWatch Logs

---

## 🤔 Assumptions and Notes

### Assumptions Made:
1. **No audio processing** - VAPI handles all voice/audio processing; this is just a webhook server
2. **Stateless application** - No persistent storage needed (perfect for Fargate)
3. **External services** - VAPI, GoHighLevel, and Twilio are managed externally
4. **Port 3000** - Default port, can be changed via PORT env var
5. **HTTP only** - SSL/TLS termination happens at the ALB level

### Performance:
- **CPU**: 256 (0.25 vCPU) should be sufficient for webhook processing
- **Memory**: 512 MB is adequate for this Node.js app
- **Scaling**: Can scale to 10+ tasks easily based on load

### Entry Point:
- Main application: `src/index.blueprint.js`
- Starts Express server on configured PORT
- Healthcheck available at `/health`
- Multiple webhook endpoints for VAPI and GHL integration

### Questions to Clarify:
- ❓ Do you need environment-specific configs (dev/staging/prod)?
- ❓ What's your expected call volume (for auto-scaling setup)?
- ❓ Do you have existing AWS infrastructure (VPC, subnets, etc.)?
- ❓ Need help setting up CI/CD pipeline (GitHub Actions → ECR → ECS)?

---

## 📚 Additional Resources

- [AWS ECS Fargate Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [VAPI Webhooks Documentation](https://docs.vapi.ai/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Need help?** Review the logs with `docker logs vapi-assistant` locally or check CloudWatch Logs in AWS.

