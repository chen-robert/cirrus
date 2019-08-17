#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void trim();

int main(void)
{
  char *inPath = getenv("INPUT_PATH");
  char *ansPath = getenv("ANSWER_PATH");
  char *runCmd = getenv("RUN_CMD");

  FILE *inFile = fopen(inPath, "r");
  FILE *ansFile = fopen(ansPath, "r");

  if (inFile == NULL)
  {
    fprintf(stderr, "input file missing\n");
    return 1;
  }

  if (ansFile == NULL)
  {
    fprintf(stderr, "answer file missing\n");
    return 2;
  }

  char buf[1024];

  FILE *fp = popen(runCmd, "r+");
  while (fgets(buf, 1023, inFile) != NULL)
  {
    fprintf(fp, "%s", buf);
  }

  if (fp == NULL)
  {
    puts("RTE");
    return 0;
  }

  char* line = NULL;
  char* line2 = NULL;
  size_t len = 0;
  while (getline(&line, &len, fp) != -1) {
    trim(line);

    if(getline(&line2, &len, ansFile) == -1) {
      if(strlen(line) == 0) {
        break;
      } else {
        puts("WA");
        return 0;
      }
    }

    trim(line2);

    if (strcmp(line, line2) != 0) {
      puts("WA");
      return 0;
    }
  }

  while (getline(&line2, &len, ansFile) != -1)
  {
    trim(line2);

    if(strlen(line2) != 0) {
      puts("WA");
      return 0;
    }
  }

  puts("AC");

  fclose(inFile);
  fclose(ansFile);
  pclose(fp);

  return 0;
}

void trim(char* str) {
  int i=strlen(str)-1;

  while(i >= 0 && (str[i] == ' ' || str[i] == '\r' || str[i] == '\n')) i--;

  str[i+1] = '\0';
}